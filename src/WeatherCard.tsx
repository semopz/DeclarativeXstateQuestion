import React, { FC, useEffect } from "react";
import { WeatherContext } from "./weatherMachine";
import { Interpreter } from "xstate";
import { useService } from "@xstate/react";

type WeatherCardProps = {
  service: Interpreter<WeatherContext>;
};

export const WeatherCard: FC<WeatherCardProps> = ({ service }) => {
  useEffect(() => {
    service.onTransition(
      (ctx, evt) => void console.log("Child Evt:", evt, "Child Ctx:", ctx)
    );
  }, [service]);
  const [current, send] = useService(service);
  console.log(current.event);
  return (
    <div>
      {current.value}
      <button onClick={() => void send("INITIATE")}>start</button>
    </div>
  );
};
