const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function sendChatMessage(
  sessionId: string,
  messages: { role: string; content: string }[],
  resumeText?: string
) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      messages,
      resume_text: resumeText || null,
    }),
  });

  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

export async function uploadResume(sessionId: string, file: File) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/upload-resume`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload resume");
  return res.json();
}

export async function startResearch(
  sessionId: string,
  company: string,
  role: string
) {
  const res = await fetch(`${API_URL}/api/research/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, company, role }),
  });

  if (!res.ok) throw new Error("Failed to start research");
  return res.json();
}

export function streamResearchProgress(
  boardId: string,
  onProgress: (data: {
    message: string;
    stage: string;
    progress: number;
  }) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) {
  const eventSource = new EventSource(
    `${API_URL}/api/research/${boardId}/stream`
  );

  eventSource.addEventListener("progress", (event) => {
    const data = JSON.parse(event.data);
    onProgress(data);
  });

  eventSource.addEventListener("complete", () => {
    eventSource.close();
    onComplete();
  });

  eventSource.onerror = () => {
    eventSource.close();
    onError(new Error("Research stream disconnected"));
  };

  return () => eventSource.close();
}

export async function getResearchResults(boardId: string) {
  const res = await fetch(`${API_URL}/api/research/${boardId}/results`);
  if (!res.ok) throw new Error("Results not ready");
  return res.json();
}
