import { useMemo, useState } from "react";
import type { CostCenter } from "../types/incident";

interface Props {
  costCenters: CostCenter[];
  value: string; // id del centro seleccionado (= código); "" = Todos
  onChange: (id: string) => void;
}

const MAX_VISIBLE = 50;

function label(center: CostCenter): string {
  return center.code ? `${center.code} — ${center.name}` : center.name;
}

/** Filtro de centro de costo con búsqueda por código y por nombre (reemplaza al desplegable:
 *  son 122 centros y un <select> es inmanejable). */
export function CostCenterCombobox({ costCenters, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = costCenters.find((center) => center.id === value);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? costCenters.filter(
          (center) =>
            center.name.toLowerCase().includes(q) || (center.code ?? "").toLowerCase().includes(q),
        )
      : costCenters;
    return base.slice(0, MAX_VISIBLE);
  }, [query, costCenters]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <label className="cc-combobox" style={{ position: "relative" }}>
      Centro de costo
      <input
        type="text"
        value={open ? query : selected ? label(selected) : ""}
        placeholder="Todos — busca por código o nombre"
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(event) => {
          setOpen(true);
          setQuery(event.target.value);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open ? (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 20,
            margin: 0,
            padding: 0,
            listStyle: "none",
            maxHeight: 260,
            overflowY: "auto",
            background: "var(--surface, #fff)",
            border: "1px solid var(--border, #d0d0d0)",
            borderRadius: 6,
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
          }}
        >
          <li
            onMouseDown={(event) => {
              event.preventDefault();
              pick("");
            }}
            style={{ padding: "8px 10px", cursor: "pointer", opacity: 0.8 }}
          >
            Todos
          </li>
          {matches.map((center) => (
            <li
              key={center.id}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(center.id);
              }}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                background: center.id === value ? "var(--surface-hover, #eef)" : "transparent",
              }}
            >
              {label(center)}
            </li>
          ))}
          {matches.length === 0 ? (
            <li style={{ padding: "8px 10px", opacity: 0.7 }}>Sin coincidencias</li>
          ) : null}
        </ul>
      ) : null}
    </label>
  );
}
