import "./styles.css";
import React, { useEffect } from "react";
import * as ReactDOM from "react-dom";
import { useMachine } from "@xstate/react";
import { getUsageLoggerMachine } from "./usageLoggerMachine";
import { WeatherCard } from "./WeatherCard";
interface ToggleContext {
  count: number;
}

const usageLoggerMachine = getUsageLoggerMachine(false);
function App() {
  const [current, send, service] = useMachine(usageLoggerMachine);
  useEffect(() => {
    service.onEvent(ev => void console.log("Logger Event:", ev));
  }, [service]);
  const { apiRequests } = current.context;
  console.log("Logger: ", current.event);
  return (
    <div className="App">
      <h1>XState React Template</h1>
      <h2>Fork this template!</h2>
      <button
        onClick={() =>
          send({
            type: "NEW_REQUEST",
            endpoint: "https://www.metaweather.com/api/location/44418/"
          })
        }
      />{" "}
      {apiRequests.map(apiReq => (
        <WeatherCard service={apiReq} />
      ))}
      <code />
      <div />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
