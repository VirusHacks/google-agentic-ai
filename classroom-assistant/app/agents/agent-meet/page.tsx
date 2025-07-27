"use client"
import React, { useState, useEffect } from 'react';

const AiInterview = () => {
  const [iframeSrc, setIframeSrc] = useState("https://agentic-meet-delta.vercel.app/");

  useEffect(() => {
    const handleIframeNavigation = (event) => {
      // Only listen to messages from App 1
      if (event.origin !== "https://agentic-meet-delta.vercel.app/") return;

      const { action, url } = event.data;
      if (action === "navigate") {
        setIframeSrc(url); // Update the iframe's src to the new URL
      }
    };

    window.addEventListener("message", handleIframeNavigation);
    return () => {
      window.removeEventListener("message", handleIframeNavigation);
    };
  }, []);

  return (
    <div>
      <div className="max-w-9xl mx-20 mt-5" style={{ overflow: "hidden" }}>
        <iframe
          src={iframeSrc}
          width="100%"
          height="100%"
          style={{
            height: "80vh",
            overflow: "hidden",
          }}
          allow="camera; microphone; autoplay; encrypted-media"
        />
      </div>
    </div>
  );
};

export default AiInterview;
