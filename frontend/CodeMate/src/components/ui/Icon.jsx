import React from "react";

export function Icon({ name, className = "" }) {
  // If you pass an emoji or SVG, it renders here
  return <div className={className}>{name}</div>;
}
