"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = formatTime;

function formatTime(timestamp) {
  if (!timestamp) return "-";
  var date = new Date(timestamp);
  var options = {
    year: "numeric",
    month: "short",
    
    // Jan, Feb, etc.
    day: "2-digit"
  };
  
  return date.toLocaleDateString("en-US", options);
}
