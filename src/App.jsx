import {io} from "socket.io-client";
import {useCallback, useEffect, useState} from "react";
import Chart from "react-apexcharts";

const socket = io(import.meta.env.VITE_API_URL, {
    reconnection: true,
});


function App() {

    const [isRealTime, setIsRealTime] = useState(true);

    const chartOptions = {
        options: {
            chart: {
                id: "system-load",
                toolbar: {
                    tools: {
                        download: false,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: false,
                        customIcons: [{
                            icon: isRealTime ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-play"></i>',
                            // index: 3,
                            title: 'Stop real-time data',
                            class: 'custom-icon',
                            click: function () {
                                if (isRealTime) {
                                    stopRealTimeData();
                                }else{
                                    getRealTimeData();
                                }
                            },
                        }]
                    },
                },
            },
            title: {
                text: 'System Load',
                align: 'left'
            },
            yaxis: {
                labels: {
                    formatter: function (value) {
                        return value + '%'; // This will format the y-axis labels as percentages
                    }
                }
            },
            xaxis: {
                labels: {
                    formatter: function () {
                        return new Date().toLocaleTimeString(); // This will format the x-axis labels as time
                    }
                },
            },
        },
        series: [
            {
                name: "CPU Load"
            },
            {
                name: "Ram Load"
            }
        ]
    };

    const [cpuLoad, setCpuLoad] = useState([{
        name: "cpu-load",
        data: [10, 20, 30, 40, 50, 60, 70, 80]
    }]);

    const [ramLoad, setRamLoad] = useState([{
        name: "ram-load",
        data: [10, 20, 30, 40, 50, 60, 70, 80]
    }]);

    const pushToCpuLoad = useCallback((dataPoint) => {
        if (!dataPoint) return;
        const newSeries = [...cpuLoad[0].data, dataPoint];
        if (newSeries.length > 10) {
            newSeries.shift();
        }
        setCpuLoad([{name, data: newSeries}]);
    }, [cpuLoad]);

    const pushToRamLoad = useCallback((dataPoint) => {
        if (!dataPoint) return;
        const newSeries = [...ramLoad[0].data, dataPoint];
        if (newSeries.length > 10) {
            newSeries.shift();
        }
        setRamLoad([{name, data: newSeries}]);
    }, [ramLoad])

    const combineCPUAndRAM = useCallback(() => {
        return [
            {
                name: "cpu-load",
                data: cpuLoad[0].data
            },
            {
                name: "ram-load",
                data: ramLoad[0].data
            },
        ]
    }, [cpuLoad, ramLoad])

    const getRealTimeData = useCallback(() => {
        socket.on('perfData', (data) => {
            if (data.length === 0) return;
            data.forEach((d) => {
                if (d._field === 'cpu') pushToCpuLoad(d._value)
                if (d._field === 'ram') pushToRamLoad(d._value)
            })
        });
        setIsRealTime(true);
    }, [pushToCpuLoad, pushToRamLoad]);

    const stopRealTimeData = () => {
        socket.off('perfData');
        setIsRealTime(false);
    }

    useEffect(() => {

        socket.on('connect', () => {
            console.log('Connected to the server');
        });

        getRealTimeData();

        // Cleanup function to remove event listeners when component unmounts
        return () => {
            socket.off('connect');
            socket.off('perfData');
        };
    }, [getRealTimeData]);

    return (
        <>
            <Chart
                options={chartOptions.options}
                series={combineCPUAndRAM()}
                type="line"
                width="100%"
                height="600"
            />
        </>
    )
}

export default App
