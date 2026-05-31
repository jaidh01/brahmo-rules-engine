import { useState } from "react";
import { User } from "../lib/types";

type Props = {
  onUserAdded: (user: User) => void;
  onClose: () => void;
};

const API = "http://localhost:7000";

export default function AddUserForm({ onUserAdded, onClose }: Props) {
  const [newUser, setNewUser] = useState({
    id: "", name: "", role: "VIEWER", department: "",
    ceiling_level: 10, compliance_clearance: "",
  });
  const [msg, setMsg] = useState("");

  const addUser = async () => {
    const payload = {
      ...newUser,
      id: newUser.id || `U-${newUser.name.toUpperCase().replace(/\s/g, "-")}`,
      compliance_clearance: newUser.compliance_clearance
        ? newUser.compliance_clearance.split(",").map(s => s.trim()).filter(Boolean)
        : [],
    };
    const res = await fetch(`${API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setMsg("✅ User added!");
      onUserAdded(data.user);
      setTimeout(() => onClose(), 1500);
    } else {
      setMsg(`❌ ${data.detail}`);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg p-4 z-20 w-80 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-3">Add New User</h3>
      <div className="space-y-2">
        {[
          { k: "name",       label: "Name",             ph: "e.g. Dr. Preethi" },
          { k: "department", label: "Department",        ph: "e.g. pharmacy" },
          { k: "id",         label: "ID (auto if blank)", ph: "e.g. U-PREETHI" },
        ].map(({ k, label, ph }) => (
          <div key={k}>
            <label className="text-xs text-gray-400">{label}</label>
            <input
              className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mt-0.5 border border-gray-600"
              placeholder={ph}
              value={(newUser as any)[k]}
              onChange={e => setNewUser({ ...newUser, [k]: e.target.value })}
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400">Role</label>
            <select
              className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mt-0.5 border border-gray-600"
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            >
              {["VIEWER","EDITOR","HOD","ADMIN","QUALITY","AUDITOR"].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Ceiling Level</label>
            <input
              type="number" min={1} max={15}
              className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mt-0.5 border border-gray-600"
              value={newUser.ceiling_level}
              onChange={e => setNewUser({ ...newUser, ceiling_level: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Compliance Tags (comma-separated)</label>
          <input
            className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mt-0.5 border border-gray-600"
            placeholder="e.g. MNPI, PHI"
            value={newUser.compliance_clearance}
            onChange={e => setNewUser({ ...newUser, compliance_clearance: e.target.value })}
          />
        </div>
        {msg && <p className="text-xs text-center">{msg}</p>}
        <button
          onClick={addUser}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-sm"
        >
          Add & Select User
        </button>
      </div>
    </div>
  );
}