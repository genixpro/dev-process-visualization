import stickProgrammer from './stick-programmer.png';
import './App.css';
import React from "react";


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
                 })
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







class App extends React.Component{
    state = {
        workCenters: []
    };

    componentDidMount() {
        this.setState({
            newTicketNumber: 0,
            workCenters: [
                {
                    name: "dev",
                    next: "qa",
                    speed: 20,
                    createNew: true,
                    queuedTickets: [],
                    workers: [
                        {
                            ticket: null,
                        },
                        {
                            ticket: null
                        },
                        {
                            ticket: null
                        }
                    ]
                },
                {
                    name: "qa",
                    next: "completed",
                    speed: 20,
                    createNew: false,
                    queuedTickets: [],
                    workers: [
                        {
                            ticket: null,
                        },
                        {
                            ticket: null,
                        },
                        {
                            ticket: null,
                        }
                    ]
                },
                {
                    name: "completed",
                    next: null,
                    speed: 0,
                    createNew: false,
                    queuedTickets: [],
                    workers: []
                }
            ]
        });


        setInterval(() =>
        {
            this.doSimulationStep();
        }, 500)
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


        newState.workCenters = newState.workCenters.map((workCenter) => {
            const queuedTickets = workCenter.queuedTickets;

            const workers = workCenter.workers.map((worker) => {
                if (worker.ticket) {
                    const newTicket = {
                        ...worker.ticket,
                        completion: {
                          ...worker.ticket.completion,
                          [workCenter.name]: worker.ticket.completion[workCenter.name] + workCenter.speed
                        }
                    };

                    if (newTicket.completion[workCenter.name] >= 100) {
                        if (workCenter.next) {
                            transitioningTickets[workCenter.next].push(newTicket);
                        }
                        return {
                            ...worker,
                            ticket: null,
                        }
                    } else {
                        return {
                            ...worker,
                            ticket: newTicket,
                        }
                    }
                } else {
                    if (queuedTickets.length > 0) {
                        const newTicket = queuedTickets.shift();
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
                            completion: {
                                dev: Math.round(Math.random() * 80),
                                qa: Math.round(Math.random() * 80)
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


    render() {
    return (
        <div className="App">
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
