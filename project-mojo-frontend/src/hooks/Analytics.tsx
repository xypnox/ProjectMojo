import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
// import ReactGA from "react-ga";

declare global {
  interface Window {
    statvoo: any;
  }
}

const useEvents = () => {
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!window.location.href.includes("localhost")) {
      // ReactGA.initialize("UA-190358650-1", { debug: true });
      if (window.statvoo !== null) setInitialized(true);
      // console.log("Initialization");
    }
  }, []);

  let trackEvent = (key: string, value: string): void => {
    if (initialized) {
      window.statvoo.event(key, value);
    }
  };

  return trackEvent;
};

export { useEvents };
