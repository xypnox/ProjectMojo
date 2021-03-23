import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/Auth";
import API from "../api";
import Gravatar from "react-gravatar";

interface RequestData {
  request_method: string;
  url: string;
  created_at: Date;
}

export default function UserPage() {
  const auth = useAuth();
  let [requests, setRequests] = useState([] as RequestData[]);
  const [lastBilling, setLastBilling] = useState(new Date());

  var options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  useEffect(() => {
    API.get("/plan", auth?.authHeader()).then((r) => {
      console.log(r.data);
      if (r.data.requests) {
        let processed = r.data.requests.map((r: any) => {
          return { ...r, created_at: new Date(r.created_at) };
        });
        processed.sort(function (a: RequestData, b: RequestData): number {
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return b.created_at.getTime() - a.created_at.getTime();
        });
        setRequests(processed);
        setLastBilling(new Date(r.data.last_billing_ts));
      }
      return () => {
        setRequests([]);
      };
    });
  }, [auth]);

  return (
    <div className="user_page">
      <div className="dash">
        <div className="stats">
          <Gravatar email={auth?.user?.email} size={128} className="dp" />
          <h1>{auth?.user?.name}</h1>
          <p>
            Plan: <span className="highlight">{auth?.user?.plan}</span>
          </p>
          <p>
            Billing from:{" "}
            <span className="highlight">
              {lastBilling.toLocaleString("en-IN")}
            </span>
          </p>
          <p>
            API requests used:{" "}
            <span className="highlight">{requests.length}</span>
          </p>
        </div>
        <div className="requests">
          <h1>API key</h1>
          <code>{auth?.user?.token}</code>
          {requests.length > 0 && (
            <div className="wrap">
              <h1>Requests</h1>
              {requests.map((r, i) => {
                return (
                  <div className="req" key={r.created_at.toString() + i}>
                    <p>{r.request_method}</p>
                    <p>{r.url}</p>
                    <p>{r.created_at.toLocaleString("en-IN", options)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
