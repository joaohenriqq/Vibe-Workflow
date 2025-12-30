'use client';

import React, { useEffect, useState } from "react";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals } from "reactflow";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { apiNodeModels } from "./utility";
import { getRunId, getWorkflowId } from "./WorkflowStore";
import axios from "axios";
import { toast } from "react-toastify";
import { IoClose } from "react-icons/io5";
import { RiInputMethodLine } from "react-icons/ri";

const outputHandles = [
  "apiOutput",
];

const ApiNode = ({ id, data, selected }) => {
  const [selectedModel, setSelectedModel] = useState(data.selectedModel || apiNodeModels[0]);
  const [connectedInputs, setConnectedInputs] = useState({});
  const [connectedOutputs, setConnectedOutputs] = useState({});
  const [formValues, setFormValues] = useState(data.formValues || {});
  const [taskData, setTaskData] = useState(apiNodeModels[0].input_params?.properties || {});
  const exposedHandles = data.exposedHandles || [];
  const [dropDown, setDropDown] = useState(0);
  const [loading, setLoading] = useState(0);
  const workflowId = getWorkflowId();
  const runId = getRunId();
  const nodeSchemas = data.nodeSchemas || {};
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const edges = useStore((state) => state.edges);

  const initializeFormData = (schemaProperties) => {
    const initialData = {};
    const fieldEntries = Object.entries(schemaProperties || {});

    fieldEntries.forEach(([fieldName, fieldSchema]) => {
      if (fieldSchema.type === "array") {
        if (fieldSchema.items?.type === "object") {
          const examples = fieldSchema.examples;
          if (Array.isArray(examples) && examples.length > 0) {
            initialData[fieldName] = examples.map((ex) => ({ ...ex }));
          } else {
            initialData[fieldName] = [];
          }
        } else {
          initialData[fieldName] = fieldSchema.examples || [];
        }

      } else if (fieldSchema.type === "object") {
        const nestedProps = fieldSchema.properties || {};
        initialData[fieldName] = initializeFormData(nestedProps);

      } else if (fieldSchema.default !== undefined) {
        initialData[fieldName] = fieldSchema.default;

      } else if (fieldSchema.examples && fieldSchema.examples.length > 0) {
        initialData[fieldName] = fieldSchema.examples[0];

      } else {
        switch (fieldSchema.type) {
          case "boolean":
            initialData[fieldName] = false;
            break;
          case "int":
          case "number":
            initialData[fieldName] = 0;
            break;
          default:
            initialData[fieldName] = "";
        }
      }
    });

    return initialData;
  };

  const addFormValuesInTaskData = (properties) => {
    const defaults = initializeFormData(properties);

    const validKeys = Object.keys(properties);
    const filteredFormValues = Object.entries(data.formValues || {}).reduce((acc, [key, val]) => {
      if (validKeys.includes(key)) acc[key] = val;
      return acc;
    }, {});

    const merged = Object.entries({ ...defaults, ...filteredFormValues }).reduce(
      (acc, [key, val]) => {
        const meta = properties[key];
        if (meta?.enum && !meta.enum.includes(val)) {
          acc[key] = meta.default ?? meta.enum[0] ?? "";
        } else {
          acc[key] = val;
        }
        return acc;
      },
      {}
    );
    setFormValues(merged);
  };
  
  const fetchSchema = (workflowId) => {
    if (!workflowId) {
      toast.error("Failed to save workflow before running node");
      setLoading(0);
      return;
    }

    axios.get(`/api/workflow/${workflowId}/api-node-schemas`)
    .then((response) => {
      const schemas = response.data.api_node_schemas;
      if (schemas[id]) {
        const schemaObj = schemas[id]?.schema;
        const inputSchema = schemaObj?.input_schema;
        const fullProps = {
          model_url: {
            type: "string",
            default: formValues.model_url || "",
            required: true,
          },
          api_key: {
            type: "string",
            default: formValues.api_key || "",
            required: true,
          },
          ...inputSchema,
        };
        addFormValuesInTaskData(fullProps);
        const prevTaskData = apiNodeModels[0].input_params?.properties
        setTaskData({ ...prevTaskData, ...inputSchema, });
      } else {
        toast.warn(`No schema found for id: ${id}`);
      }
      setLoading(0);
    })
    .catch((error) => {
      setLoading(0);
      toast.error(error.response?.data?.detail || "Failed to fetch model details.");
      console.error(error);
    })
  };

  useEffect(() => {    
    if (data?.formValues?.model_url && data?.formValues?.model_url !== "") {
      fetchSchema(workflowId);
    }
  }, []);

  useEffect(() => {
    if (data.triggerRun) {
      handleRunSingleNode();
      data.onDataChange(id, { triggerRun: false });
    }

    if (data.triggerInputs) {
      fetchInputs();
      data.onDataChange(id, { triggerInputs: false });
    }

    if (data.selectedModel) {
      setSelectedModel(data.selectedModel);
    }
  }, [data.selectedModel, data.triggerRun, data.triggerInputs]);
  
  useEffect(() => {
    updateNodeInternals(id);
  }, [formValues, id]);

  const handleChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setDropDown(-1);
  };

  const handleToggleHandle = (field) => {
    const current = data.exposedHandles || [];
    const isRemoving = current.includes(field);

    if (isRemoving) {
      setEdges((eds) => eds.filter(e => !(e.target === id && e.targetHandle === field)));
    }

    const updated = isRemoving
      ? current.filter(h => h !== field)
      : [...current, field];
    
    setNodes((nds) => nds.map((n) => 
      n.id === id ? { ...n, data: { ...n.data, exposedHandles: updated } } : n
    ));
  };

  useEffect(() => {
    const incoming = JSON.stringify(data.formValues);
    const current = JSON.stringify(formValues);
    if (incoming === current) return;

    const timer = setTimeout(() => {
      if (Object.entries(data.formValues || {}).length > 0) {
        setFormValues(data.formValues);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [data.formValues]);

  useEffect(() => {
    if (data?.onDataChange) {
      data.onDataChange(id, { selectedModel, formValues, taskData, loading });
    }
  }, [selectedModel, formValues, taskData, loading]);

  const pollNodeStatus = (run_id) => {
    const interval = setInterval(() => {
      axios.get(`/api/workflow/run/${run_id}/status`)
      .then((response) => {
        const nodeData = response.data.nodes?.[id];
        if (!nodeData || nodeData.length === 0) return;
        const latest = nodeData[nodeData.length - 1];
        if (latest.status === "succeeded") {
          const output = latest.result.outputs;
          const val = output[0].value || "";
          data?.onDataChange?.(id, { outputs: output, resultUrl: val, isLoading: false, errorMsg: null });

          clearInterval(interval);
        }

        if (latest.status === "failed") {
          const outputs = latest?.result?.outputs;
          let errorMsg = "Generation failed";

          if (outputs && outputs[0]?.value?.error) {
            errorMsg = outputs[0].value.error; 
          }
          toast.error(`Node ${id} failed`);
          data.onDataChange(id, { isLoading: false, errorMsg });
          clearInterval(interval);
        }
      })
      .catch((error) => {
        console.log(error);
        clearInterval(interval);
        data.onDataChange(id, { isLoading: false });
        toast.error(`Failed to get workflow status Image ${id.replace(/^\D+/g, "")}`);
      });
    }, 3000);
  };

  const handleRunSingleNode = async () => {
    if (!runId) {
      toast.error("No run_id available!. Click 'Run All' button");
      return;
    }
    try {
      data.onDataChange(id, { isLoading: true });
      const workflow_id = await data.handleSaveWorkFlow();

      if (!workflow_id) {
        toast.error("Failed to save workflow before running node");
        data.onDataChange(id, { isLoading: false });
        return;
      }

      const modelSchema = nodeSchemas?.categories?.api?.models[selectedModel.id];
      if (!modelSchema || !modelSchema.input_schema) {
        toast.error("No input schema found for this model");
        data.onDataChange(id, { isLoading: false });
        return;
      }
      const params = {};
      const inputSchema = modelSchema.input_schema;
      const localSources = formValues || {};
      for (const [key, meta] of Object.entries(inputSchema)) {
        if (localSources.hasOwnProperty(key)) {
          params[key] = localSources[key];
        } else {
          params[key] = meta.default ?? null;
        }
      }

      const filteredInputParams = Object.fromEntries(
        Object.entries(formValues).filter(([key]) =>
          key !== "model_url" && key !== "api_key"
        )
      );
      params["params"] = filteredInputParams;

      const response = await axios.post(`/api/workflow/${workflow_id}/node/${id}/run`,
        {
          run_id: runId,
          model: selectedModel.id,
          params: params,
        }
      );
      pollNodeStatus(response.data.run_id);
    } catch(error) {
      data.onDataChange(id, { isLoading: false });
      toast.error(error.response?.data?.detail || "Error running node");
      console.error(error);
    };
  };

  const handleDeleteNode = () => {
    if (window.confirm(`Are you sure you want to delete this ${id} node?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      toast.info(`Deleted node ${id}`);
    };
  };

  const fetchInputs = async () => {
    if (!formValues?.model_url || !formValues.model_url.trim()) {
      toast.error("Model URL is required before fetching schema");
      return;
    }

    if (!formValues?.api_key || !formValues.api_key.trim()) {
      toast.error("API Key is required before fetching schema");
      return;
    }

    setLoading(1);
    const workflow_id = await data.handleSaveWorkFlow();

    if (!workflow_id) {
      toast.error("Failed to save workflow before running node");
      setLoading(0);
      return;
    }
    fetchSchema(workflow_id);
  };

  useEffect(() => {
    const connectedOutputs = {};
    outputHandles.forEach((h) => {
      connectedOutputs[h] = edges.some(
        (e) => e.source === id && e.sourceHandle === h
      );
    });

    const connectedInputs = {};
    Object.keys(taskData).forEach((key) => {
      connectedInputs[key] = edges.some(
        (e) => e.target === id && e.targetHandle === key
      );
    });

    setConnectedOutputs(connectedOutputs);
    setConnectedInputs(connectedInputs);
  }, [edges, id, taskData]);  

  const minHeight = Math.max(208, 150 + Object.keys(taskData).length * 50);

  return (
    <div 
      style={{ minHeight }} 
      className={`nowheel group flex flex-col w-80 bg-[#0c0d0f] rounded-2xl border-2 relative transition-all duration-500 ease-in-out ${selected ? "border-white": "border-gray-500"}`}
    >
      <h3 className="absolute -top-5 left-0 text-gray-300 text-xs">Api {id.replace(/^\D+/g, "")}</h3>
      <div className="flex items-center justify-between bg-[#151618] rounded-t-2xl border-b border-gray-800 p-2">
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            className={`p-1 rounded cursor-pointer text-white bg-transparent flex`}
          >
            <RiInputMethodLine size={18} />
          </button>
          <button
            type="button"
            onClick={() => setDropDown(prev => prev === 1 ? 0: 1)}
            className="flex items-center gap-1 text-white text-xs text-center cursor-pointer truncate"
          >
            {selectedModel.name}
          </button>
          <button
            type="button"
            onClick={handleDeleteNode}
            className="font-bold p-1 hover:bg-[#494c52] rounded cursor-pointer text-gray-400 hover:text-red-500 ml-auto"
          >
            <IoClose size={18} />
          </button>
        </div>
      </div>
      <div className="flex items-center flex-grow justify-center w-full h-full rounded transition-all duration-500">
        {data.isLoading ? (
          <div className="flex items-center justify-center w-full h-full overflow-hidden aspect-[1/1]">
            <div className="flex items-center justify-center text-xs skeleton w-full h-full">Generating...</div>
          </div>
        ) : data.errorMsg ? (
          <div className="text-red-300 text-sm p-2">
            {data.errorMsg || "Failed Generation"}
          </div>
        ) : data.resultUrl && !data.isLoading ? (
          <img
            src={data.resultUrl}
            alt="Generated"
            className="w-full h-full rounded-md object-contain"
          />
        ) : (
          <p className="text-gray-400 text-sm italic">Generation results appeared here...</p>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-gray-700 mt-auto p-2 md:hidden">
        <button
          type="button"
          onClick={handleRunSingleNode}
          disabled={data.isLoading}
          className="text-xs flex items-center gap-2 cursor-pointer disabled:opacity-70 group disabled:cursor-not-allowed rounded text-black bg-white px-2 py-1 border border-gray-500 hover:text-white hover:bg-black"
        >
          {data.isLoading ? (
            <><div className="w-3 h-3 rounded-full border border-t-transparent group-hover:border-t-transparent border-black group-hover:border-white animate-spin"></div>Generating...</>
          ) : (
            <><BsArrowUpCircleFill size={16} /> Generate</>
          )}
        </button>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="apiOutput" 
        style={{ 
          top: 100,
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-2 transition-all duration-200 !right-[-7px]
          ${connectedOutputs.apiOutput 
            ? '!bg-green-500 !border-white shadow-[0_0_20px_rgba(34,197,94,1)]' 
            : '!bg-black !border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]'
          }
          hover:!scale-125 hover:shadow-[0_0_20px_rgba(34,197,94,1)]
        `}
        data-type="green"
      />
      <p 
        className={`absolute -right-10 top-[100px] text-xs text-green-500 transition-opacity duration-200 ${
          data.activeHandleColor === "green"
            ? "opacity-100" 
            : "opacity-0 group-hover:opacity-100"
        }`}
      > 
        Image 
      </p>

      {Object.entries(taskData).map(([key, meta], idx) => {
        const isExposed = connectedInputs[key] || exposedHandles.includes(key);
        return (
          <React.Fragment key={key}>
            <Handle 
              type="target" 
              position={Position.Left} 
              id={key} 
              style={{ 
                top: 150 + idx * 50,
                width: 12,
                height: 12,
                transition: 'all 0.2s ease-in-out',
                opacity: isExposed ? 1 : 0,
                pointerEvents: isExposed ? 'all' : 'none',
              }} 
              className={`!rounded-full !border-2 transition-all duration-200 !left-[-7px]
                ${connectedInputs[key] 
                  ? '!bg-blue-500 !border-white shadow-[0_0_20px_rgba(59,130,246,1)]' 
                  : '!bg-black !border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                }
                hover:!scale-125 hover:shadow-[0_0_20px_rgba(59,130,246,1)]
              `}
              data-type="blue"
            />
            <p 
              className={`absolute -left-20 top-[${150 + idx * 0}px] text-xs text-blue-500 text-right w-16 transition-opacity duration-200 ${
                isExposed
                  ? "opacity-100" 
                  : "opacity-0 group-hover:opacity-100"
              }`}
               style={{ top: 150 + idx * 50, opacity: isExposed ? undefined : 0, pointerEvents: isExposed ? 'all' : 'none' }} 
            > 
              {key} 
            </p>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ApiNode;
