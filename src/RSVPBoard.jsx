import React, { useEffect, useMemo, useState, useRef } from "react";
import { Undo2, Download, Upload, Plus, X, Edit2, UserPlus, Trash2, Save, FolderOpen } from "lucide-react";

// Empty default - will load from localStorage or start fresh
const EMPTY_DATA = {
  "Yes": [],
  "Maybe": [],
  "No": [],
  "No Response": []
};

// Example data for Mexican Independence Cookout
const EXAMPLE_DATA = {
  "Yes": [
    "Kasey", "Abby", "Joe", "Izzy", "Addi", "Dylan", "Paige", "Jonah", "Liv", "Sua",
    "Alyssa", "Emma", "Lexi", "Cate", "Kaylee", "Rayyan", "Henry", "Grace", "Ashley",
    "Annika", "Jenna", "Leah", "John", "Connor", "Marie", "Mary", "Brayde", "Taylor", "Julia"
  ],
  "Maybe": ["Sloan", "Megan", "Keziah"],
  "No": ["Ruthie", "Lucy", "Tessa", "Maria", "Julia Mercer"],
  "No Response": [
    "Ashlyn", "Bri", "Syd", "Maggie", "Ellen", "Ella", "Laurel", "Sarah",
    "Hana", "Anna", "Brett", "Ben", "Sriya", "Liron", "Cole", "Jessie"
  ]
};

const STORAGE_KEY = "rsvp-board-state-v3";
const SAVED_SNAPSHOT_KEY = "rsvp-board-saved-snapshot";

const tackColors = {
  "Yes": "bg-gradient-to-br from-yellow-400 to-yellow-600",
  "Maybe": "bg-gradient-to-br from-yellow-500 to-amber-600",
  "No": "bg-gradient-to-br from-amber-400 to-yellow-600",
  "No Response": "bg-gradient-to-br from-yellow-400 to-yellow-600"
};

export default function RSVPBoard() {
  const [lists, setLists] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure all required keys exist
        return {
          "Yes": parsed["Yes"] || [],
          "Maybe": parsed["Maybe"] || [],
          "No": parsed["No"] || [],
          "No Response": parsed["No Response"] || []
        };
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
    // Start with empty board if no saved state
    return EMPTY_DATA;
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingName, setEditingName] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [hasSavedSnapshot, setHasSavedSnapshot] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    // Check if there's a saved snapshot on mount
    setHasSavedSnapshot(!!localStorage.getItem(SAVED_SNAPSHOT_KEY));
  }, []);

  const counts = useMemo(() => ({
    yes: lists["Yes"].length,
    maybe: lists["Maybe"].length,
    no: lists["No"].length,
    noresp: lists["No Response"].length,
    total: Object.values(lists).reduce((a, b) => a + b.length, 0),
    unique: new Set(Object.values(lists).flat()).size
  }), [lists]);

  function handleDragStart(e, name, from) {
    setDraggedItem({ name, from });
    e.dataTransfer.setData("text/plain", JSON.stringify({ name, from }));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e, to) {
    e.preventDefault();
    setDropTarget(null);
    const txt = e.dataTransfer.getData("text/plain");
    if (!txt) return;
    const { name, from } = JSON.parse(txt);
    if (!name || from === to) return;

    setLists((prev) => {
      const next = { ...prev };
      next[from] = next[from].filter((n) => n !== name);
      if (!next[to].includes(name)) next[to] = [name, ...next[to]];
      return next;
    });

    setDraggedItem(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(e, column) {
    setDropTarget(column);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  }

  function handleDragEnd() {
    setDraggedItem(null);
    setDropTarget(null);
  }

  function addName() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Check if name already exists anywhere
    const allNames = Object.values(lists).flat();
    if (allNames.includes(trimmed)) {
      alert(`"${trimmed}" is already on the board!`);
      return;
    }

    // Add to "No Response" by default
    setLists(prev => ({
      ...prev,
      "No Response": [trimmed, ...prev["No Response"]]
    }));

    setNewName("");
    setShowAddForm(false);
  }

  function deleteName(name, from) {
    if (window.confirm(`Remove "${name}" from the board?`)) {
      setLists(prev => ({
        ...prev,
        [from]: prev[from].filter(n => n !== name)
      }));
    }
  }

  function startEdit(name, from) {
    setEditingName({ name, from });
    setEditValue(name);
  }

  function saveEdit() {
    if (!editingName) return;

    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditingName(null);
      return;
    }

    // Check if new name already exists (except for the current name)
    const allNames = Object.values(lists).flat().filter(n => n !== editingName.name);
    if (allNames.includes(trimmed)) {
      alert(`"${trimmed}" is already on the board!`);
      return;
    }

    setLists(prev => ({
      ...prev,
      [editingName.from]: prev[editingName.from].map(n =>
        n === editingName.name ? trimmed : n
      )
    }));

    setEditingName(null);
    setEditValue("");
  }

  function saveSnapshot() {
    if (window.confirm("Save current board state? This will overwrite any previously saved state.")) {
      localStorage.setItem(SAVED_SNAPSHOT_KEY, JSON.stringify(lists));
      setHasSavedSnapshot(true);
      alert("Board state saved successfully!");
    }
  }

  function loadSnapshot() {
    if (window.confirm("Load saved state? This will replace all current names.")) {
      try {
        const savedSnapshot = localStorage.getItem(SAVED_SNAPSHOT_KEY);
        if (savedSnapshot) {
          setLists(JSON.parse(savedSnapshot));
        } else {
          // Fall back to example data if no snapshot exists
          setLists(EXAMPLE_DATA);
        }
      } catch (e) {
        console.error("Failed to load snapshot:", e);
        setLists(EXAMPLE_DATA);
      }
    }
  }

  function clearBoard() {
    if (window.confirm("Clear all names from the board?")) {
      setLists(EMPTY_DATA);
    }
  }

  function downloadCSV() {
    const rows = ["Name,Status"];
    Object.entries(lists).forEach(([status, names]) => {
      names.forEach((n) => rows.push(`${escapeCSV(n)},${escapeCSV(status)}`));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvp_board_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const lines = text.split('\n').filter(line => line.trim());
        const newLists = { "Yes": [], "Maybe": [], "No": [], "No Response": [] };

        lines.forEach((line, index) => {
          if (index === 0) return; // Skip header

          const [name, status] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          if (name && newLists[status]) {
            if (!newLists[status].includes(name)) {
              newLists[status].push(name);
            }
          }
        });

        if (window.confirm("Import CSV? This will replace all current names.")) {
          setLists(newLists);
        }
      } catch (error) {
        alert("Failed to import CSV. Please check the file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }

  return (
    <div className="min-h-screen w-full bg-green-900">
      <div className="min-h-screen mexican-bg">
        <div className="p-6 md:p-10">
          <div className="mx-auto max-w-7xl">
            <header className="mb-8">
              <div className="bg-white/95 rounded-lg p-6 shadow-xl border-4 border-yellow-500/30 backdrop-blur-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-green-800" style={{ fontFamily: 'Georgia, serif' }}>
                      🇲🇽 RSVP Board - Mexican Independence
                    </h1>
                    <p className="text-sm text-green-700 mt-1 font-semibold">
                      September 19 • {counts.unique} attendees
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Drag to organize • Auto-saved
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {showAddForm ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addName()}
                          placeholder="Enter name"
                          className="px-3 py-2 border-2 border-green-600 rounded bg-white text-green-900 placeholder-green-400"
                          autoFocus
                        />
                        <button
                          onClick={addName}
                          className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded shadow-md hover:from-green-700 hover:to-green-800 border border-yellow-400"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setShowAddForm(false); setNewName(''); }}
                          className="px-3 py-2 bg-gray-600 text-white rounded shadow-md hover:bg-gray-700 border border-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="px-3 py-2 bg-green-700 text-white rounded shadow-md hover:bg-green-800 flex items-center gap-2 border border-yellow-400"
                        >
                          <UserPlus className="h-4 w-4"/>Add Name
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={importCSV}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded shadow-md hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 border border-yellow-400"
                        >
                          <Upload className="h-4 w-4"/>Import
                        </button>
                        <button
                          onClick={downloadCSV}
                          className="px-3 py-2 bg-yellow-600 text-white rounded shadow-md hover:bg-yellow-700 flex items-center gap-2 border border-green-600"
                        >
                          <Download className="h-4 w-4"/>Export
                        </button>
                        <button
                          onClick={saveSnapshot}
                          className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded shadow-md hover:from-green-700 hover:to-green-800 flex items-center gap-2 border border-yellow-400"
                          title="Save current board state"
                        >
                          <Save className="h-4 w-4"/>Save Current
                        </button>
                        <button
                          onClick={loadSnapshot}
                          className={`px-3 py-2 bg-gradient-to-r ${
                            hasSavedSnapshot
                              ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                              : 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                          } text-white rounded shadow-md flex items-center gap-2 border ${
                            hasSavedSnapshot ? 'border-yellow-400' : 'border-gray-400'
                          }`}
                          title={hasSavedSnapshot ? "Load saved state" : "Load default list (no saved state)"}
                        >
                          <FolderOpen className="h-4 w-4"/>
                          {hasSavedSnapshot ? 'Load Saved' : 'Load Default'}
                        </button>
                        <button
                          onClick={clearBoard}
                          className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded shadow-md hover:from-red-700 hover:to-red-800 flex items-center gap-2 border border-red-400"
                          title="Clear all names"
                        >
                          <Trash2 className="h-4 w-4"/>Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <StatsBar counts={counts} />

            <div className="mt-6 space-y-4">
              {(["Yes","Maybe","No","No Response"]).map((col) => (
                <Column
                  key={col}
                  title={col}
                  names={lists[col]}
                  onDrop={(e) => handleDrop(e, col)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, col)}
                  onDragLeave={handleDragLeave}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDelete={deleteName}
                  onEdit={startEdit}
                  editingName={editingName}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditSave={saveEdit}
                  onEditCancel={() => setEditingName(null)}
                  isDropTarget={dropTarget === col}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({
  title, names, onDrop, onDragOver, onDragEnter, onDragLeave,
  onDragStart, onDragEnd, onDelete, onEdit, editingName,
  editValue, onEditChange, onEditSave, onEditCancel, isDropTarget
}) {
  const getTheme = () => {
    switch(title) {
      case "Yes": return {
        border: "border-green-600 border-4",
        bg: "bg-gradient-to-br from-green-50 to-green-100/50",
        titleColor: "text-green-800",
        icon: "✅",
        countBg: "bg-green-600 text-white",
        shadow: "shadow-green-200"
      };
      case "Maybe": return {
        border: "border-yellow-500 border-4",
        bg: "bg-gradient-to-br from-yellow-50 to-amber-50",
        titleColor: "text-yellow-700",
        icon: "🤔",
        countBg: "bg-yellow-500 text-white",
        shadow: "shadow-yellow-200"
      };
      case "No": return {
        border: "border-red-600 border-4",
        bg: "bg-gradient-to-br from-red-50 to-pink-50",
        titleColor: "text-red-700",
        icon: "❌",
        countBg: "bg-red-600 text-white",
        shadow: "shadow-red-200"
      };
      default: return {
        border: "border-gray-400 border-3",
        bg: "bg-white",
        titleColor: "text-gray-700",
        icon: "📝",
        countBg: "bg-gray-600 text-white",
        shadow: "shadow-gray-200"
      };
    }
  };

  const theme = getTheme();

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className="relative w-full"
    >
      <div className={`${theme.bg} rounded-lg px-4 ${title === 'Yes' ? 'py-4' : 'py-3'} shadow-xl ${theme.border} ${
        isDropTarget ? 'shadow-2xl ring-4 ring-yellow-400/50 scale-[1.01]' : theme.shadow
      } backdrop-blur-sm transition-all duration-200 overflow-visible`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${theme.titleColor}`}>
            <span className="text-2xl">{theme.icon}</span>
            {title}
          </h2>
          <span className={`text-lg font-bold px-3 py-1 rounded-full shadow-md ${theme.countBg}`}>
            {names.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 min-h-[80px] pt-3 overflow-visible">
          {names.map((name, index) => (
            <StickyNote
              key={name}
              name={name}
              from={title}
              index={index}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDelete={onDelete}
              onEdit={onEdit}
              isEditing={editingName?.name === name && editingName?.from === title}
              editValue={editValue}
              onEditChange={onEditChange}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
            />
          ))}

          {names.length === 0 && (
            <div className={`rounded border-2 border-dashed ${theme.border.replace('border-4', 'border-2')} opacity-40 p-8 text-center ${theme.titleColor} opacity-60`}>
              Drop names here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StickyNote({
  name, from, index, onDragStart, onDragEnd, onDelete, onEdit,
  isEditing, editValue, onEditChange, onEditSave, onEditCancel
}) {
  const randomRotation = useMemo(() => Math.random() * 4 - 2, []);
  const tackColor = tackColors[from];

  const getNoteColor = () => {
    switch(from) {
      case "Yes": return "bg-gradient-to-br from-white to-green-50";
      case "Maybe": return "bg-gradient-to-br from-white to-yellow-50";
      case "No": return "bg-gradient-to-br from-white to-red-50";
      default: return "bg-gradient-to-br from-gray-50 to-white";
    }
  };

  const noteColor = getNoteColor();

  if (isEditing) {
    return (
      <div
        className={`relative p-2 rounded shadow-md sticky-note-texture note-card ${getNoteColor()}`}
        style={{
          '--rotation': `${randomRotation}deg`,
          transform: `rotate(${randomRotation}deg)`,
          width: '120px'
        }}
      >
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg pin-head border border-yellow-300">
          <div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full" />
        </div>
        <div className="pt-1 flex gap-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') onEditSave();
              if (e.key === 'Escape') onEditCancel();
            }}
            className="flex-1 px-2 py-1 text-sm bg-white/80 border border-amber-400 rounded"
            autoFocus
          />
          <button
            onClick={onEditSave}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            ✓
          </button>
          <button
            onClick={onEditCancel}
            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, name, from)}
      onDragEnd={onDragEnd}
      className={`relative cursor-move p-2 rounded shadow-md sticky-note-texture note-card group ${noteColor}`}
      style={{
        '--rotation': `${randomRotation}deg`,
        transform: `rotate(${randomRotation}deg)`,
        width: '120px',
        minHeight: '80px'
      }}
    >
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg pin-head border border-yellow-300">
        <div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full" />
      </div>

      <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(name, from); }}
          className="p-0.5 bg-blue-600/70 text-white rounded hover:bg-blue-700"
          title="Edit name"
        >
          <Edit2 className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(name, from); }}
          className="p-0.5 bg-red-600/70 text-white rounded hover:bg-red-700"
          title="Delete name"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>

      <div className="pt-3 text-center">
        <span
          className="text-xs font-medium text-gray-800 break-words"
          style={{ fontFamily: 'Kalam, cursive' }}
          onDoubleClick={() => onEdit(name, from)}
        >
          {name}
        </span>
      </div>

      <div className="absolute bottom-0 right-0 w-4 h-4 opacity-30">
        <div className="w-full h-full bg-gradient-to-br from-transparent via-amber-200/20 to-amber-300/30"
             style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
      </div>
    </div>
  );
}

function StatsBar({ counts }) {
  const getPercentage = (value) => {
    if (counts.total === 0) return 0;
    return Math.round((value / counts.total) * 100);
  };

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-white to-green-50 rounded-lg p-4 shadow-xl border-3 border-yellow-500">
        <div className="text-center mb-4">
          <div className="text-5xl font-bold text-green-800">{counts.total}</div>
          <div className="text-sm uppercase tracking-wide text-green-600 font-semibold">Total Invitations</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Yes"
            value={counts.yes}
            percentage={getPercentage(counts.yes)}
            color="bg-green-100 border-green-600 text-green-800"
          />
          <StatCard
            label="Maybe"
            value={counts.maybe}
            percentage={getPercentage(counts.maybe)}
            color="bg-yellow-100 border-yellow-600 text-yellow-700"
          />
          <StatCard
            label="No"
            value={counts.no}
            percentage={getPercentage(counts.no)}
            color="bg-red-100 border-red-600 text-red-800"
          />
          <StatCard
            label="No Response"
            value={counts.noresp}
            percentage={getPercentage(counts.noresp)}
            color="bg-gray-100 border-gray-600 text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, percentage, color }) {
  return (
    <div className={`${color} rounded-lg border-2 p-3 shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full -mr-8 -mt-8"></div>
      <div className="text-xs uppercase tracking-wide font-semibold">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm opacity-75">({percentage}%)</div>
      </div>
    </div>
  );
}

function escapeCSV(s) {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}