"use client"
import React from 'react'
import { WorkflowBuilder } from "workflow-builder"
import "reactflow/dist/style.css"
import "react-toastify/dist/ReactToastify.css";
import "workflow-builder/dist/tailwind.css"

const Workflow = () => {
  return (
    <div className="h-screen w-screen bg-black">
      <WorkflowBuilder />
    </div>
  )
}

export default Workflow;
