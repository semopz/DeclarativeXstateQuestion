import { Machine, sendParent, send, assign, DoneInvokeEvent } from "xstate";

interface WeatherStates {
  states: {
    idle: {};
    querying: {};
    resolved: {};
    rejected: {};
  };
}

type WeatherEvents = { type: "GO" } | { type: "INITIATE" };

export type WeatherContext = {
  endpoint: string;
  iconUrl?: string;
  locationTitle?: string;
  temp?: number;
};

export interface ConsolidatedWeather {
  id: any;
  weather_state_name: string;
  weather_state_abbr: string;
  wind_direction_compass: string;
  created: Date;
  applicable_date: string;
  min_temp: number;
  max_temp: number;
  the_temp: number;
  wind_speed: number;
  wind_direction: number;
  air_pressure: number;
  humidity: number;
  visibility: number;
  predictability: number;
}

export interface Parent {
  title: string;
  location_type: string;
  woeid: number;
  latt_long: string;
}

export interface Source {
  title: string;
  slug: string;
  url: string;
  crawl_rate: number;
}

export interface Weather {
  consolidated_weather: ConsolidatedWeather[];
  time: Date;
  sun_rise: Date;
  sun_set: Date;
  timezone_name: string;
  parent: Parent;
  sources: Source[];
  title: string;
  location_type: string;
  woeid: number;
  latt_long: string;
  timezone: string;
}

export const weatherMachine = Machine<
  WeatherContext,
  WeatherStates,
  WeatherEvents
>(
  {
    id: "weatherMachine",
    initial: "idle",
    on: {
      INITIATE: {
        actions: "console",
        target: "querying"
      }
    },
    states: {
      idle: {
        // entry: (ctx, evt) => ,
        // entry: sendParent(() => ({ type: "LOG_ME"})),
        on: {
          GO: "querying"
        }
      },
      querying: {
        on: {
          INITIATE: {
            actions: "console"
          }
        },
        invoke: {
          src: "getWeather",
          onDone: {
            actions: assign((_, evt: DoneInvokeEvent<Weather>) => {
              const {
                data: {
                  consolidated_weather: [weather],
                  title
                }
              } = evt;
              const temp = Math.round(weather.the_temp);
              const iconUrl = `https://www.metaweather.com/static/img/weather/png/${
                weather.weather_state_abbr
              }.png`;

              return {
                iconUrl,
                temp,
                locationTitle: title
              };
            }),
            target: "resolved"
          },
          onError: "rejected"
        }
      },
      resolved: {},
      rejected: {}
    }
  },
  {
    services: {
      getWeather: async ctx => {
        const response = await fetch(ctx.endpoint);
        const weather: Weather = await response.json();
        return weather;
      }
    },
    actions: {
      console: ctx => void console.log("hi")
    }
  }
);
