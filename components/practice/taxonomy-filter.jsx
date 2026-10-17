"use client";

import { useEffect, useMemo, useState } from "react";
import { get } from "@/lib/client-api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// Cascading category → subject → topic + difficulty picker.
// Calls onChange({ subjectId, topicId, difficulty }) whenever the selection changes.
export function TaxonomyFilter({ onChange, showDifficulty = true }) {
  const [tree, setTree] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    get("/api/v1/taxonomy").then(setTree).catch(() => {});
  }, []);

  const subjects = useMemo(
    () => tree.find((c) => c.id === categoryId)?.subjects ?? [],
    [tree, categoryId]
  );
  const topics = useMemo(
    () => subjects.find((s) => s.id === subjectId)?.topics ?? [],
    [subjects, subjectId]
  );

  useEffect(() => {
    onChange?.({ subjectId: subjectId || undefined, topicId: topicId || undefined, difficulty: difficulty || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, topicId, difficulty]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Picker
        label="ক্যাটাগরি"
        value={categoryId}
        onValueChange={(v) => { setCategoryId(v); setSubjectId(""); setTopicId(""); }}
        options={tree.map((c) => ({ value: c.id, label: c.nameBn }))}
      />
      <Picker
        label="বিষয়"
        value={subjectId}
        disabled={!categoryId}
        onValueChange={(v) => { setSubjectId(v); setTopicId(""); }}
        options={subjects.map((s) => ({ value: s.id, label: s.nameBn }))}
      />
      <Picker
        label="টপিক"
        value={topicId}
        disabled={!subjectId}
        onValueChange={setTopicId}
        options={topics.map((t) => ({ value: t.id, label: t.nameBn }))}
      />
      {showDifficulty && (
        <Picker
          label="কঠিনতা"
          value={difficulty}
          onValueChange={setDifficulty}
          options={[
            { value: "EASY", label: "সহজ" },
            { value: "MEDIUM", label: "মাঝারি" },
            { value: "HARD", label: "কঠিন" },
          ]}
        />
      )}
    </div>
  );
}

function Picker({ label, value, onValueChange, options, disabled }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="সব" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
