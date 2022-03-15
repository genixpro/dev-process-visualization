import stickProgrammer from './stick-programmer.png';
import './App.css';
import React from "react";
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import _ from "lodash";

function renderTicket(params) {
 return <div className={"ticket"} key={params.number}>
     <div className={"ticket-header"}>
         {params.number}
     </div>
     <div className={"ticket-completion-box"}>
         {
             Object.keys(params.completion).map((completionKey) => {
                 return <div className={"single-ticket-completion-box"} key={completionKey}>
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
                    {params.queueName ? <span className={"work-center-label"}>{params.queueName}</span> : null}
                    { params.queuedTickets.slice(0, maxQueueLengthToDisplay).map((ticket) => renderTicket(ticket)) }
                    {
                        params.queuedTickets.length > maxQueueLengthToDisplay ?
                            <div className={"remaining-queue-items"}>{params.queuedTickets.length - maxQueueLengthToDisplay} more tickets</div>
                        : null
                    }
                </div>
                <div className={"work-center-workers"}>
                    {params.workerName ? <span className={"work-center-label"}>{params.workerName}</span> : null}
                    {
                        params.workers.map((worker, workerIndex) => {
                            return <div className={"worker-box"}
                                        style={({
                                            top: `${worker.top}vh`,
                                            left: `${worker.left}vw`
                                        })}
                                        key={workerIndex}>

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


function renderStatistics(title, value, digits) {
    return <div className={"single-statistic"} key={title}>
        <span>{title}</span>
        <span>{value ? value.toFixed(digits ?? 1) : "n/a"}</span>
    </div>
}


function renderWorkCenterStatistics(params) {
    return [
        renderStatistics(`${params.name} cumulative utilization rate`, (100 * params.utilizedFrames / params.totalWorkerFrames)),
        renderStatistics(`${params.name} cumulative throughput`, (10 * params.completedTickets / params.totalFrames)),
        renderStatistics(`${params.name} queue length`, (params.queuedTickets.length), 0)
    ];
}




class App extends React.Component{
    state = {
        workCenters: []
    };

    defaultConfiguration = {
        framerate: 5,
        limitWIP: false,
        shiftResources: false,
        devs: 3,
        qa: 3,
        devops: 3,
        dev_randomness: 90,
        qa_randomness: 90,
        devops_randomness: 90,
        enableQA: true,
        enableDevops: false,
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
        let devopsWorkers = [];
        for (let num = 0; num < config.devops; num += 1) {
            devopsWorkers.push({
                ticket: null,
            });
        }
        let devWorkCenter = {
            name: "dev",
            next: null,
            queueName: "backlog",
            workerName: "developers",
            speed: 10,
            createNew: true,
            active: true,
            shiftResourcesTo: null,
            limitWIP: config.limitWIP,
            queuedTickets: [],
            workers: devWorkers,
            utilizedFrames: 0,
            totalWorkerFrames: 0,
            totalFrames: 0,
            completedTickets: 0
        };
        let devOpsWorkCenter = {
            name: "devops",
            next: null,
            queueName: "devops queue",
            workerName: "devops engineers",
            speed: 10,
            createNew: false,
            active: true,
            shiftResourcesTo: null,
            limitWIP: config.limitWIP,
            queuedTickets: [],
            workers: devopsWorkers,
            utilizedFrames: 0,
            totalWorkerFrames: 0,
            totalFrames: 0,
            completedTickets: 0
        };
        let qaWorkCenter = {
            name: "qa",
            next: null,
            queueName: "testing queue",
            workerName: "qa team",
            speed: 10,
            createNew: false,
            active: true,
            shiftResourcesTo: null,
            limitWIP: false,
            queuedTickets: [],
            workers: qaWorkers,
            utilizedFrames: 0,
            totalWorkerFrames: 0,
            totalFrames: 0,
            completedTickets: 0
        };
        let completedWorkCenter = {
            name: "completed",
            next: null,
            queueName: "completed tickets",
            workerName: "",
            speed: 0,
            createNew: false,
            active: false,
            limitWIP: false,
            queuedTickets: [],
            workers: [],
            utilizedFrames: 0,
            totalWorkerFrames: 0,
            totalFrames: 0,
            completedTickets: 0
        }

        let workCenters = [
            devWorkCenter,
        ];

        if (config.enableDevops) {
            workCenters.push(devOpsWorkCenter);
        }

        if (config.enableQA) {
            workCenters.push(qaWorkCenter);
        } else {
            devWorkCenter.speed = devWorkCenter.speed / 2;
        }

        workCenters.push(completedWorkCenter);

        workCenters.forEach((workCenter, workCenterIndex) =>
        {
            if (workCenterIndex < (workCenters.length - 1)) {
                workCenter.next = workCenters[workCenterIndex + 1].name;
            }

            if (config.shiftResourcesTo) {
                if (workCenterIndex < (workCenters.length - 2)) {
                    workCenter.shiftResourcesTo = workCenter.next;
                } else {
                    workCenter.shiftResourcesTo = workCenters[workCenterIndex - 1].name;
                }
            } else {
                workCenter.shiftResourcesTo = null;
            }
        })

        this.setState({
            config,
            newTicketNumber: 0,
            totalCompleted: 0,
            totalFrames: 0,
            workCenters
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
            totalCompleted: this.state.totalCompleted,
            totalFrames: this.state.totalFrames + 1,
        };

        const transitioningTickets = {};
        newState.workCenters.forEach((workCenter) => {
            transitioningTickets[workCenter.name] = [];
        });

        const transitioningWorkers = {};
        newState.workCenters.forEach((workCenter) => {
            transitioningWorkers[workCenter.name] = [];
        });

        // Increase end to end time and queue time on all queued tickets
        newState.workCenters.forEach((workCenter) => {
            if (!workCenter.active) {
                return workCenter;
            }
            if (workCenter.createNew) {
                return workCenter;
            }

            workCenter.queuedTickets.forEach((ticket) => {
                ticket.endToEndTime += 1;
                ticket.queueTime += 1;
            });
        });

        newState.workCenters.forEach((workCenter) => {
            if (!workCenter.active) {
                return;
            }

            workCenter.totalFrames += 1;

            const keptWorkers = [];

            workCenter.workers.forEach((worker) => {
                workCenter.totalWorkerFrames += 1;
                if (worker.ticket) {
                    worker.ticket.endToEndTime += 1;
                    worker.ticket.touchTime += 1;
                    worker.ticket.completion[workCenter.name] += workCenter.speed;

                    if (worker.ticket.completion[workCenter.name] >= 100) {
                        if (workCenter.next) {
                            transitioningTickets[workCenter.next].push(worker.ticket);
                            worker.ticket = null;
                            workCenter.completedTickets += 1;
                            if (workCenter.next === "completed") {
                                newState.totalCompleted += 1;
                            }
                        }
                        workCenter.utilizedFrames += 1;
                    } else {
                        workCenter.utilizedFrames += 1;
                    }
                    keptWorkers.push(worker);

                } else {
                    let nextWorkCenter = null;
                    if (workCenter.next) {
                        nextWorkCenter = _.find(newState.workCenters, {name: workCenter.next});
                    }
                    const isNextWorkCenterReady = (nextWorkCenter && (!nextWorkCenter.active || nextWorkCenter.queuedTickets.length < 10));

                    if (workCenter.queuedTickets.length > 0) {
                        if (workCenter.shiftResourcesTo && !isNextWorkCenterReady) {
                            transitioningWorkers[workCenter.shiftResourcesTo].push(worker);
                        } else if (!workCenter.limitWIP || isNextWorkCenterReady) {
                            const newTicket = workCenter.queuedTickets.shift();
                            workCenter.utilizedFrames += 1;
                            worker.ticket = newTicket;
                            keptWorkers.push(worker);
                        } else {
                            keptWorkers.push(worker);
                        }
                    } else {
                        if (workCenter.shiftResourcesTo) {
                            transitioningWorkers[workCenter.shiftResourcesTo].push(worker);
                        } else {
                            keptWorkers.push(worker);
                        }
                    }
                }

                workCenter.workers = keptWorkers;
            });
        });

        // Handle tickets and workers that have been moved from other work centers
        newState.workCenters.forEach((workCenter) => {
            if (transitioningTickets[workCenter.name]) {
                workCenter.queuedTickets = workCenter.queuedTickets.concat(transitioningTickets[workCenter.name]);
            }
            if (transitioningWorkers[workCenter.name]) {
                workCenter.workers = workCenter.workers.concat(transitioningWorkers[workCenter.name]);
            }
        });

        newState.workCenters.forEach((workCenter) => {
            const queuedTickets = workCenter.queuedTickets;

            if (workCenter.createNew) {
                while (queuedTickets.length < 15) {
                    newState.newTicketNumber += 1;

                    const completion = {};

                    newState.workCenters.forEach((workCenterForInitialVal) => {
                        if (workCenterForInitialVal.active) {
                            completion[workCenterForInitialVal.name] = Math.round(50 + ((Math.random() - 0.5) * this.state.config[workCenterForInitialVal.name + "_randomness"]))
                        }
                    });

                    queuedTickets.push(
                        {
                            number: `BAC-${newState.newTicketNumber}`,
                            endToEndTime: 0,
                            touchTime: 0,
                            queueTime: 0,
                            completion: completion
                        });
                }
            }
        });

        this.setState(newState);
    }

    computeAverageTicketStatistic(variable) {
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

        for (let x = 0; x < Math.min(completedWorkCenter.queuedTickets.length, 50); x += 1) {
            const ticket = completedWorkCenter.queuedTickets[completedWorkCenter.queuedTickets.length - (x + 1)];
            total += ticket[variable];
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
                <Box width={300}>
                    <span className={"slider-label"}>DevOps Randomness</span>
                    <Slider
                        marks
                        min={0}
                        step={10}
                        max={100}
                        defaultValue={this.defaultConfiguration.devops_randomness}
                        aria-label="Randomness" onChange={(evt) => this.changeConfiguration({devops_randomness: evt.target.value})}
                    />
                </Box>
                <FormGroup>
                    <FormControlLabel
                        className={"checkbox-control"}
                        control={<Checkbox />}
                        label="Kanban style (wait for next queue to be less then 10)"
                        onChange={(evt) => this.changeConfiguration({limitWIP: evt.target.checked}) }
                    />
                </FormGroup>
                <FormGroup>
                    <FormControlLabel
                        className={"checkbox-control"}
                        control={<Checkbox defaultChecked />}
                        label="Enable separate QA team"
                        onChange={(evt) => this.changeConfiguration({enableQA: evt.target.checked}) }
                    />
                </FormGroup>
                <FormGroup>
                    <FormControlLabel
                        className={"checkbox-control"}
                        control={<Checkbox />}
                        label="Enable separate devops team"
                        onChange={(evt) => this.changeConfiguration({enableDevops: evt.target.checked}) }
                    />
                </FormGroup>
                <FormGroup>
                    <FormControlLabel
                        className={"checkbox-control"}
                        control={<Checkbox />}
                        label="Shift Resources Between Teams"
                        onChange={(evt) => this.changeConfiguration({shiftResources: evt.target.checked}) }
                    />
                </FormGroup>
            </div>

            <div className={"statistics-area"}>
                {
                    renderStatistics("End to End Throughput", 10 * this.state.totalCompleted / this.state.totalFrames)
                }
                {
                    renderStatistics("End to End Time", this.computeAverageTicketStatistic('endToEndTime'))
                }
                {
                    renderStatistics("Touch Time", this.computeAverageTicketStatistic('touchTime'))
                }
                {
                    renderStatistics("Touch Time Ratio", this.computeAverageTicketStatistic('touchTime') / this.computeAverageTicketStatistic('endToEndTime'), 2)
                }
                {
                    renderStatistics("Queue Time", this.computeAverageTicketStatistic('queueTime'))
                }
                {
                    this.state.workCenters.map((workCenter, workCenterIndex) => {
                        if (!workCenter.speed) {
                            return null;
                        }

                        return renderWorkCenterStatistics(workCenter, workCenterIndex);
                    })
                }
            </div>

            <div className={"work-centers-area"}>
                {
                    this.state.workCenters.map((workCenter, workCenterIndex) => {
                        return renderWorkCenter(workCenter, workCenterIndex);
                    })
                }
            </div>

        </div>
    );
  }
}

export default App;
