"use client";

import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { FiTrash2 } from "react-icons/fi";
import { GoWorkflow } from "react-icons/go";
import { SlOptions } from "react-icons/sl";
import { toast, ToastContainer } from "react-toastify";
import { HiOutlineArrowRight } from "react-icons/hi2";

const WorkflowList = () => {
  const [workflowList, setWorkflowList] = useState([]);
  const [loading, setLoading] = useState(1);
  const [dropDown, setDropDown] = useState(0);
  const [workflowName, setWorkflowName] = useState("");
  const [renameId, setRenameId] = useState(null);

  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    if (fromBuilder) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      window.location.reload();
    }
  }, []);

  const getUserWorkflowDefs = () => {
    axios.get('/api/workflow/get-workflow-defs')
      .then((response) => {
        setLoading(0);
        setWorkflowList(response.data);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response?.data?.error || "Failed to fetch workflows");
        setLoading(0);
        setWorkflowList([]);
      });
  };

  useEffect(() => {
    getUserWorkflowDefs();
  }, []);

  const handleDeleteWorkflow = (deleteId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workflow? This action cannot be undone."
    );
    if (!confirmDelete) return;

    axios.delete(`/api/workflow/delete-workflow-def/${deleteId}`)
      .then(() => {
        setWorkflowList(prev => prev.filter(w => w.id !== deleteId));
        setDropDown(0);
        toast.success("Workflow deleted successfully");
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response?.data?.error || "Failed to delete workflow");
      });
  };

  const handleRenameWorkflow = (id, newName) => {
    if (!newName.trim()) return;
    setLoading(3);
    axios.post(`/api/workflow/update-name/${id}`, { name: newName })
      .then(() => {
        setRenameId(null);
        setLoading(0);
        setWorkflowList((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, name: newName, updated_at: new Date().toISOString() }
              : w
          )
        );
        toast.success("Workflow renamed");
      })
      .catch((error) => {
        console.error(error);
        setRenameId(null);
        setLoading(0);
        toast.error(error.response?.data?.error || "Failed to rename workflow");
      });
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', ' -');
  };

  const handleCreateWorkFlow = () => {
    const workflowPayload = {
      workflow_id: null,
      name: "Untitled Workflow",
      edges: [],
      data: { nodes: [] },
    };
    setLoading(2);
    axios.post("/api/workflow/create", workflowPayload)
      .then((response) => {
        window.location.href = `/workflow/${response.data.workflow_id}`;
      })
      .catch((error) => {
        console.error(error);
        setLoading(0);
        toast.error(error.response?.data?.detail || "Server error");
      });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-white overflow-x-hidden selection:bg-blue-500/30">
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:px-12">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-16">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              Your Workflows
            </h1>
            <p className="text-zinc-500 mt-2">Manage and orchestrate your automated processes.</p>
          </div>
          <button
            onClick={handleCreateWorkFlow}
            disabled={loading === 2}
            className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] active:scale-95 disabled:opacity-50"
          >
            {loading === 2 ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaPlus />
            )}
            New Workflow
          </button>
        </header>

        {loading === 1 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" />
            <span className="mt-4 text-zinc-500 animate-pulse">Loading your creative bank...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workflowList.length > 0 ? (
              workflowList.map((work) => (
                <div
                  key={work.id}
                  className="group relative h-64 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-1 shadow-2xl"
                >
                  <Link href={`/workflow/${work.id}`} className="absolute inset-0 z-0">
                    <div
                      className="absolute inset-0 bg-center bg-cover opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 duration-500"
                      style={{ backgroundImage: work.thumbnail ? `url(${work.thumbnail})` : 'none' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent" />
                  </Link>

                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDropDown(dropDown === work.id ? 0 : work.id);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                    >
                      <SlOptions size={16} />
                    </button>
                    {dropDown === work.id && (
                      <div 
                        className="absolute right-0 mt-2 w-36 py-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
                        onMouseLeave={() => setDropDown(0)}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setRenameId(work.id);
                            setWorkflowName(work.name);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <FaRegEdit size={14} /> Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteWorkflow(work.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <FiTrash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col gap-2 pointer-events-none translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-2">
                       <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <GoWorkflow size={18} />
                       </div>
                       <h3 className="font-bold text-lg truncate group-hover:text-blue-400 transition-colors">{work.name || "Untitled"}</h3>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{formatDateTime(work.updated_at)}</span>
                      <HiOutlineArrowRight size={18} className="text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center">
                <GoWorkflow size={48} className="text-zinc-800 mb-6" />
                <h2 className="text-xl font-semibold text-zinc-400 mb-2">No workflows found</h2>
                <p className="text-zinc-600 mb-8 max-w-xs">Start your first orchestration by clicking the "New Workflow" button above.</p>
                <button
                   onClick={handleCreateWorkFlow}
                   className="text-blue-500 hover:text-blue-400 font-bold transition-colors"
                >
                  Create Now +
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {renameId && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setRenameId(null)}
        >
          <div 
            className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-6 text-center">Rename Workflow</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">New Title</label>
                <input
                  type="text"
                  value={workflowName}
                  autoFocus
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameWorkflow(renameId, workflowName);
                  }}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setRenameId(null)}
                  className="flex-1 py-3 px-4 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRenameWorkflow(renameId, workflowName)}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        theme="dark"
        toastClassName="!bg-[#111] !border !border-white/10 !rounded-xl !text-sm"
      />
    </div>
  );
};

export default WorkflowList;
