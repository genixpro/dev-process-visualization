import stickProgrammer from './stick-programmer.png';
import './App.css';
import React from "react";
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';

function renderTicket(params) {
 return <div className={"ticket"} key={params.number}>
     <div className={"ticket-header"}>
         {params.number}
     </div>
     <div className={"ticket-completion-box"}>
         {
             Object.keys(params.completion).map((completionKey) => {
                 return <div className={"single-ticket-completion-box"}>
                            <div className={`single-ticket-completion single-ticket-completion-${completionKey}`} key={completionKey}
                                  style={({
                                      top: `${params.completion[completionKey]}%`,
                                      height: `${100 - params.completion[completionKey]}%`
                                  })}
                             />
                        </div>
                 }
             )
         }
     </div>
 </div>
}



function renderWorkCenter(params, workCenterIndex) {
    let maxQueueLengthToDisplay = 5;

    return <div className={"work-center"} key={workCenterIndex}>
            <div className={"work-center-header"}>
                {params.name}
            </div>
            <div className={"work-center-body"}>
                <div className={"work-center-queue"}>
                    { params.queuedTickets.slice(0, maxQueueLengthToDisplay).map((ticket) => renderTicket(ticket)) }
                    {
                        params.queuedTickets.length > maxQueueLengthToDisplay ?
                            <div className={"remaining-queue-items"}>{params.queuedTickets.length - maxQueueLengthToDisplay} more tickets</div>
                        : null
                    }
                </div>
                <div className={"work-center-workers"}>
                    {
                        params.workers.map((worker, workerIndex) => {
                            return <div className={"worker-box"}
                                        style={({
                                            top: `${worker.top}vh`,
                                            left: `${worker.left}vw`
                                        })}>

                                <div className={"worker-ticket-box"}>
                                    {
                                        worker.ticket ? renderTicket(worker.ticket) : null
                                    }
                                </div>
                                <img
                                    key={workerIndex}
                                    src={stickProgrammer}
                                    className="worker"
                                    alt="worker"
                                    style = {({
                                        width: `7vw`,
                                    })}
                                />
                            </div>
                        })
                    }
                </div>
            </div>
    </div>
}


function renderStatistics(title, value) {
    return <div className={"single-statistic"} key={title}>
        <span>{title}</span>
        <span>{value ? value.toFixed(1) : null}</span>
    </div>
}


function renderWorkCenterStatistics(params) {
    return renderStatistics(`${params.name} cumulative utilization rate`, (100 * params.utilizedFrames / params.totalFrames));
}




class App extends React.Component{
    state = {
        workCenters: []
    };

    defaultConfiguration = {
        framerate: 10,
        devs: 3,
        qa: 3,
        dev_randomness: 50,
        qa_randomness: 50
    }

    componentDidMount() {
        this.resetConfiguration(this.defaultConfiguration)
    }

    resetConfiguration(config) {
        let devWorkers = [];
        for (let num = 0; num < config.devs; num += 1) {
            devWorkers.push({
                ticket: null,
            });
        }
        let qaWorkers = [];
        for (let num = 0; num < config.qa; num += 1) {
            qaWorkers.push({
                ticket: null,
            });
        }

        this.setState({
            config,
            newTicketNumber: 0,
            workCenters: [
                {
                    name: "dev",
                    next: "qa",
                    speed: 20,
                    createNew: true,
                    active: true,
                    queuedTickets: [],
                    workers: devWorkers,
                    utilizedFrames: 1,
                    totalFrames: 1
                },
                {
                    name: "qa",
                    next: "completed",
                    speed: 20,
                    createNew: false,
                    active: true,
                    queuedTickets: [],
                    workers: qaWorkers,
                    utilizedFrames: 1,
                    totalFrames: 1
                },
                {
                    name: "completed",
                    next: null,
                    speed: 0,
                    createNew: false,
                    active: false,
                    queuedTickets: [],
                    workers: [],
                    utilizedFrames: 1,
                    totalFrames: 1
                }
            ]
        });

        this.setFrameRate(this.state.frameRate ?? this.defaultConfiguration.framerate);
    }

    changeConfiguration(newVals) {
        const config = this.state.config;
        Object.keys(newVals).forEach(key =>
        {
            config[key] = newVals[key];
        });
        this.resetConfiguration(config);
    }

    setFrameRate(frameRate) {
        this.setState({
            frameRate: frameRate
        })

        if (this.handler) {
            clearInterval(this.handler);
        }

        this.handler = setInterval(() =>
        {
            this.doSimulationStep();
        }, Math.round(1000.0 / frameRate))
    }

    doSimulationStep() {
        const newState = {
            newTicketNumber: this.state.newTicketNumber,
            workCenters: this.state.workCenters,
        };

        const transitioningTickets = {};
        newState.workCenters.forEach((workCenter) => {
            transitioningTickets[workCenter.name] = [];
        });

        // Increase lead time on all queued tickets
        newState.workCenters = newState.workCenters.map((workCenter) => {
            if (!workCenter.active) {
                return workCenter;
            }

            return {
                ...workCenter,
                queuedTickets: workCenter.queuedTickets.map((ticket) => {
                    return {
                        ...ticket,
                        leadTime: ticket.leadTime + 1
                    }
                })
            }
        });

        newState.workCenters = newState.workCenters.map((workCenter) => {
            if (!workCenter.active) {
                return workCenter;
            }

            const queuedTickets = workCenter.queuedTickets;
            let utilizedFrames = workCenter.utilizedFrames;
            let totalFrames = workCenter.totalFrames;

            const workers = workCenter.workers.map((worker) => {
                totalFrames += 1;
                if (worker.ticket) {
                    const newTicket = {
                        ...worker.ticket,
                        leadTime: worker.ticket.leadTime + 1,
                        completion: {
                          ...worker.ticket.completion,
                          [workCenter.name]: worker.ticket.completion[workCenter.name] + workCenter.speed
                        }
                    };

                    if (newTicket.completion[workCenter.name] >= 100) {
                        if (workCenter.next) {
                            transitioningTickets[workCenter.next].push(newTicket);
                        }
                        utilizedFrames += 1;
                        return {
                            ...worker,
                            ticket: null,
                        }
                    } else {
                        utilizedFrames += 1;
                        return {
                            ...worker,
                            ticket: newTicket,
                        }
                    }
                } else {
                    if (queuedTickets.length > 0) {
                        const newTicket = queuedTickets.shift();
                        utilizedFrames += 1;
                        return {
                            ...worker,
                            ticket: newTicket
                        }
                    } else {
                        return {
                            ...worker,
                            ticket: null
                        }
                    }
                }
            });

            return {
                ...workCenter,
                queuedTickets,
                workers,
                utilizedFrames,
                totalFrames,
            }
        });

        // Handle tickets that have been moved from a prior work center
        newState.workCenters = newState.workCenters.map((workCenter) => {
            return {
                ...workCenter,
                queuedTickets: [
                    ...workCenter.queuedTickets,
                    ...transitioningTickets[workCenter.name]
                ]
            }
        });

        newState.workCenters = newState.workCenters.map((workCenter) => {
            const queuedTickets = workCenter.queuedTickets;

            if (workCenter.createNew) {
                while (queuedTickets.length < 15) {
                    newState.newTicketNumber += 1;
                    queuedTickets.push(
                        {
                            number: `BAC-${newState.newTicketNumber}`,
                            leadTime: 0,
                            completion: {
                                dev: Math.round(50 + ((Math.random() - 0.5) * this.state.config["dev_randomness"])),
                                qa: Math.round(50 + ((Math.random() - 0.5) * this.state.config["qa_randomness"]))
                            },
                        });
                }
            }

            return {
                ...workCenter,
                queuedTickets
            }
        });

        this.setState(newState);
    }

    computeLeadTimeStatistic() {
        let total = 0;
        let count = 0;
        let completedWorkCenter = null;
        for (let workCenter of this.state.workCenters) {
            if (workCenter.name === "completed") {
                completedWorkCenter = workCenter;
                break;
            }
        }
        if (completedWorkCenter === null) {
            return null;
        }

        for (let x = 0; x < Math.min(completedWorkCenter.queuedTickets.length, 25); x += 1) {
            const ticket = completedWorkCenter.queuedTickets[completedWorkCenter.queuedTickets.length - (x + 1)];
            total += ticket.leadTime;
            count += 1;
        }
        if (count > 0) {
            return total / count;
        } else {
            return null;
        }
    }


    render() {
    return (
        <div className="App">

            <div className={"controls-area"}>
                <Box width={300}>
                    <span className={"slider-label"}>Speed</span>
                    <Slider
                        marks
                        min={1}
                        step={2}
                        max={50}
                        defaultValue={this.defaultConfiguration.framerate}
                        aria-label="Speed" onChange={(evt) => this.setFrameRate(evt.target.value)}
                    />
                </Box>
                <Box width={300}>
                    <span className={"slider-label"}>Developers</span>
                    <Slider
                        marks
                        min={1}
                        step={1}
                        max={4}
                        defaultValue={this.defaultConfiguration.devs}
                        aria-label="Developers" onChange={(evt) => this.changeConfiguration({devs: evt.target.value})}
                    />
                </Box>
                <Box width={300}>
                    <span className={"slider-label"}>QA People</span>
                    <Slider
                        marks
                        min={1}
                        step={1}
                        max={4}
                        defaultValue={this.defaultConfiguration.qa}
                        aria-label="QA People" onChange={(evt) => this.changeConfiguration({qa: evt.target.value})}
                    />
                </Box>
                <Box width={300}>
                    <span className={"slider-label"}>Dev Randomness</span>
                    <Slider
                        marks
                        min={0}
                        step={10}
                        max={100}
                        defaultValue={this.defaultConfiguration.dev_randomness}
                        aria-label="Randomness" onChange={(evt) => this.changeConfiguration({dev_randomness: evt.target.value})}
                    />
                </Box>
                <Box width={300}>
                    <span className={"slider-label"}>QA Randomness</span>
                    <Slider
                        marks
                        min={0}
                        step={10}
                        max={100}
                        defaultValue={this.defaultConfiguration.qa_randomness}
                        aria-label="Randomness" onChange={(evt) => this.changeConfiguration({qa_randomness: evt.target.value})}
                    />
                </Box>
            </div>

            <div className={"work-centers-area"}>
                {
                    this.state.workCenters.map((workCenter, workCenterIndex) => {
                        return renderWorkCenter(workCenter, workCenterIndex);
                    })
                }
            </div>

            <div className={"statistics-area"}>
                    {
                        this.state.workCenters.map((workCenter, workCenterIndex) => {
                            if (!workCenter.speed) {
                                return null;
                            }

                            return renderWorkCenterStatistics(workCenter, workCenterIndex);
                        })
                    }
                    {
                        renderStatistics("Lead Time", this.computeLeadTimeStatistic())
                    }
            </div>
        </div>
    );
  }
}

export default App;
