import { Machine, assign, spawn, actions, Interpreter } from "xstate";
import { weatherMachine } from "./weatherMachine";

interface LoggerStates {
  states: {
    idle: {};
    logging: {
      states: {
        decisionPoint: {};
        gatheringRequestsWithDebounce: {};
        callingLoggingApi: {};
      };
    };
    logAgainDecision: {};
    borked: {};
  };
}

type LoggerEvents =
  | {
      type: "LOG_ME";
      requestOptions?: "string";
    }
  | {
      type: "NEW_REQUEST";
      endpoint: string;
    };

type LoggerContext = {
  count: number;
  apiRequests: Interpreter<{ endpoint: string }, any, any>[];
};

const logMeActions = ["increment", "ack"];
export const getUsageLoggerMachine = (withDebounce: boolean) =>
  Machine<LoggerContext, LoggerStates, LoggerEvents>(
    {
      id: "usageLoggerMachine",
      initial: "idle",
      context: { count: 0, apiRequests: [] },
      on: {
        LOG_ME: {
          actions: logMeActions
        },
        NEW_REQUEST: {
          actions: assign((ctx, { endpoint }) => {
            return {
              apiRequests: [
                ...ctx.apiRequests,
                spawn(weatherMachine.withContext({ endpoint }))
              ]
            };
          })
        }
      },
      states: {
        idle: {
          on: {
            LOG_ME: {
              actions: logMeActions,
              target: "logging"
            }
          }
        },

        logging: {
          initial: "decisionPoint",
          states: {
            decisionPoint: {
              on: {
                "": [
                  {
                    cond: () => withDebounce,
                    target: "gatheringRequestsWithDebounce"
                  },
                  "callingLoggingApi"
                ]
              }
            },
            gatheringRequestsWithDebounce: {
              on: {
                LOG_ME: {
                  actions: logMeActions,
                  target: "gatheringRequestsWithDebounce",
                  internal: false
                }
              },
              after: {
                50: "callingLoggingApi"
              }
            },
            callingLoggingApi: {
              invoke: {
                src: "log",
                onDone: {
                  target: "#logAgainDecision",
                  actions: "clearCount"
                }
              }
            }
          },

          on: {
            LOG_ME: {
              actions: logMeActions
            }
          }
        },
        logAgainDecision: {
          id: "logAgainDecision",
          on: {
            "": [
              {
                cond: ctx => Boolean(ctx.count),
                target: "logging"
              },
              "idle"
            ]
          }
        },
        borked: {}
      }
    },
    {
      actions: {
        increment: assign(ctx => ({
          count: ctx.count + 1
        })),
        clearCount: assign({ count: 0 }),
        ack: actions.respond("OK")
      },
      services: {
        log: async ctx =>
          new Promise(r =>
            setTimeout(() => {
              console.log(`The API was called ${ctx.count} times`);
              r();
            }, 500)
          )
      }
    }
  );
