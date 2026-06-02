import React, { useState } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";
import UserGuideButton from "@/src/components/shared/UserGuideButton";

const THEME = {
  primary: "#212c46",
  gold: "#b58c4f",
  brightGold: "#b7a159",
  bgMain: "#f3f3f1",
  success: "#657f4d",
};

interface SummaryResult {
  title: string;
  keyTakeaways: string[];
  risks: string[];
  actionItems: string[];
}

function UserGuidePanel({ isOpen, onClose }: any) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[190] bg-[#212c46]/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 z-[200] w-full md:w-[500px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col border-l-2 border-[${THEME.gold}] ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex justify-between items-center p-5 px-6 border-b-2 border-[#b7a159] bg-[#212c46] text-white shrink-0">
          <div>
            <h3 className="font-black flex items-center gap-3 uppercase tracking-widest text-lg">
              <Icons.ClipboardList size={22} className="text-[#b7a159]" /> AI
              PRODUCTION SUMMARIZER GUIDE
            </h3>
            <p className="text-[12px] font-bold text-[#d7d7d7] uppercase tracking-widest mt-1.5">
              User Manual
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-[#932c2e] hover:bg-white/10 rounded-xl transition-colors"
          >
            <Icons.X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[#414757] text-[12px] leading-relaxed custom-scrollbar bg-white">
          <section className="animate-fadeIn">
            <h4 className="text-[14px] font-black text-[#212c46] mb-3 uppercase flex items-center gap-2 border-b-2 border-[#d7d7d7] pb-2 font-mono">
              <Icons.FileText size={18} className="text-[#b7a159]" /> 1.
              การนำเข้าข้อมูล (Data Input)
            </h4>
            <p className="text-[12px] mb-3">
              AI
              สามารถช่วยคุณย่อยเนื้อหาประกาศหรือเอกสารที่ซับซ้อนให้เข้าใจง่ายขึ้น:
            </p>
            <ul className="list-none pl-0 space-y-3">
              <li className="flex items-start gap-2 bg-[#f8f9fa] p-3 rounded-xl border border-[#eaeaec]">
                <Icons.Copy
                  size={16}
                  className="shrink-0 text-[#4d87a8] mt-0.5"
                />
                <div>
                  <strong className="text-[#4d87a8]">Paste Text:</strong>{" "}
                  คัดลอกและวางเนื้อหาของประกาศหรือร่างข้อกำหนดที่ต้องการ
                </div>
              </li>
              <li className="flex items-start gap-2 bg-[#f8f9fa] p-3 rounded-xl border border-[#eaeaec]">
                <Icons.FileSearch
                  size={16}
                  className="shrink-0 text-[#657f4d] mt-0.5"
                />
                <div>
                  <strong className="text-[#657f4d]">Context Analysis:</strong>{" "}
                  ระบบจะประมวลผลตามบริบทอุตสาหกรรม
                </div>
              </li>
            </ul>
          </section>

          <section
            className="animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
          >
            <h4 className="text-[14px] font-black text-[#212c46] mb-3 uppercase flex items-center gap-2 border-b-2 border-[#d7d7d7] pb-2 font-mono">
              <Icons.BrainCircuit size={18} className="text-[#d96245]" /> 2.
              การวิเคราะห์อัจฉริยะ (Smart Analysis)
            </h4>
            <p className="text-[12px] mb-3">
              ให้ AI เป็นผู้สรุปใจความสำคัญและระบุจุดที่ต้องระวัง:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-[12px]">
              <li>
                <strong className="text-[#d96245]">Executive Summary:</strong>{" "}
                สรุปเนื้อหาสำคัญไม่ให้พลาดประเด็นหลัก
              </li>
              <li>
                <strong className="text-[#212c46]">Risk Identification:</strong>{" "}
                ระบุจุดที่มีความเสี่ยงต่อการผิดข้อบังคับ
              </li>
              <li>
                <strong className="text-[#657f4d]">Penalty Review:</strong>{" "}
                ตรวจสอบบทลงโทษและความรับผิดที่อาจเกิดขึ้น
              </li>
            </ul>
          </section>

          <section
            className="animate-fadeIn"
            style={{ animationDelay: "0.2s" }}
          >
            <h4 className="text-[14px] font-black text-[#212c46] mb-3 uppercase flex items-center gap-2 border-b-2 border-[#d7d7d7] pb-2 font-mono">
              <Icons.Zap size={18} className="text-[#3f809e]" /> 3.
              แนวทางการปฏิบัติ (Action Items)
            </h4>
            <p className="text-[12px] bg-[#3f809e]/10 p-3 rounded-xl border border-[#3f809e]/30 text-[#212c46]">
              ระบบจะเสนอแนะขั้นตอนถัดไป (Next Steps)
              เพื่อให้คุณนำไปปรับใช้ในองค์กรหรือแจ้งฝ่ายที่เกี่ยวข้องได้อย่างรวดเร็วและแม่นยำ
            </p>
          </section>
        </div>

        <div className="p-4 bg-[#f8f9fa] border-t border-[#eaeaec] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-[#212c46] text-white font-black rounded-xl uppercase text-[12px] hover:bg-[#414757] hover:text-white transition-all shadow-md tracking-[0.1em]"
          >
            เข้าใจแล้ว (Understood)
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default function ProductionSummarizer() {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleSummarize = () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setResult(null);

    // Mock processing
    setTimeout(() => {
      setResult({
        title: "สรุปสาระสำคัญของเอกสาร",
        keyTakeaways: [
          "ต้องมีการบันทึกรายงานการผลิตทุก 6 ชั่วโมง",
          "เจ้าหน้าที่ควบคุมคุณภาพ (QC) ต้องตรวจสอบผลิตภัณฑ์ตามมาตรฐาน",
          "เอกสารหลักฐานต้องอยู่ในระบบตรวจสอบย้อนกลับได้อย่างน้อย 1 ปี",
        ],
        risks: [
          "ผลิตภัณฑ์ไม่ได้มาตรฐานหากข้ามขั้นตอนตรวจสอบ",
          "ผลกระทบต่อแผนการผลิตหากวัตถุดิบไม่เพียงพอ",
        ],
        actionItems: [
          "ตรวจสอบสถานะการทำงานของเครื่องจักรหลัก",
          "จัดพิกัดการเก็บเอกสารรายงานการผลิตให้เป็นระบบ",
          "ระบุระยะเวลาที่ต้องทำการซ่อมบำรุงในรอบถัดไป",
        ],
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="flex flex-1 w-full flex-col animate-fadeIn bg-transparent space-y-4">
      {/* USER GUIDE FLOATING TAB */}
      <UserGuideButton onClick={() => setIsGuideOpen(true)} />

      <UserGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* HEADER SECTION */}
      <div className="h-14 px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center group cursor-default shrink-0">
            <div className="absolute inset-0 bg-[#b7a159] blur-[15px] opacity-30 rounded-full group-hover:opacity-70 transition-all duration-700 animate-pulse-subtle"></div>
            <div className="relative z-10 p-1.5 border border-[#b7a159]/50 rounded-xl bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
              <Icons.BookOpen
                size={28}
                strokeWidth={2.5}
                className="text-[#b58c4f]"
              />
            </div>
          </div>
          <div>
            <h3
              className="font-black text-[#212c46] uppercase tracking-tighter leading-none flex items-center gap-2"
              style={{ fontSize: "24px" }}
            >
              AI PROD{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b58c4f] to-[#8e9141]">
                SUMMARIZER
              </span>
              <span className="bg-[#b58c4f] text-white text-[9px] px-2 py-0.5 rounded-full tracking-widest ml-1 shadow-sm font-mono">
                BETA
              </span>
            </h3>
            <p className="text-[11px] font-bold text-[#b58c4f] uppercase tracking-[0.2em] mt-0.5 opacity-90 leading-none">
              INTELLIGENT PRODUCTION DOCUMENT DIGEST
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1532px] mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Input Card */}
          <div className="bg-white/90 p-6 rounded-3xl shadow-lg border border-[#eaeaec] animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-[#eaeaec] pb-3">
              <h4 className="text-[13px] font-black text-[#212c46] uppercase tracking-widest flex items-center gap-2">
                <Icons.FileText size={18} className="text-[#b58c4f]" /> Input
                Production Text
              </h4>
              <button
                onClick={() => setInputText("")}
                className="text-[10px] font-bold text-[#7a8b95] hover:text-[#932c2e] uppercase tracking-widest transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="วางข้อความ ข่าวประกาศ หรือแนวทางปฏิบัติที่ต้องการให้สรุปที่นี่..."
                className="w-full h-80 p-5 bg-[#f8f9fa] border border-[#eaeaec] rounded-2xl outline-none focus:border-[#b58c4f] focus:ring-2 focus:ring-[#b58c4f]/10 transition-all text-[#212c46] text-[14px] leading-relaxed resize-none"
              />
              {inputText.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30">
                  <Icons.UploadCloud
                    size={48}
                    className="text-[#7a8b95] mb-2"
                  />
                  <span className="text-[12px] font-bold tracking-widest uppercase text-[#7a8b95]">
                    Paste Content Here
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSummarize}
              disabled={!inputText.trim() || isProcessing}
              className={`w-full mt-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[12px] transition-all flex items-center justify-center gap-3 shadow-md ${!inputText.trim() || isProcessing ? "bg-[#eaeaec] text-[#a0aec0] cursor-not-allowed" : "bg-[#212c46] text-[#b7a159] hover:bg-[#b7a159] hover:text-[#212c46]"}`}
            >
              {isProcessing ? (
                <>
                  <Icons.Loader2 size={18} className="animate-spin" />{" "}
                  Processing Production Insights...
                </>
              ) : (
                <>
                  <Icons.Sparkles size={18} /> Summarize Document
                </>
              )}
            </button>
          </div>

          {/* Result Card */}
          <div className="bg-[#1d2636] p-6 rounded-3xl shadow-xl border border-[#414757] animate-fadeIn min-h-[500px] flex flex-col">
            {!result && !isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6 group">
                  <Icons.FileSearch
                    size={32}
                    className="text-white/20 group-hover:text-[#b7a159] transition-colors"
                  />
                </div>
                <h4 className="text-white font-black uppercase tracking-widest text-[14px] mb-2">
                  Awaiting Analysis
                </h4>
                <p className="text-white/40 text-[11px] leading-relaxed max-w-xs font-bold uppercase tracking-wider">
                  Paste a production document in the left panel to generate an
                  intelligent summary and risk assessment.
                </p>
              </div>
            ) : isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#b7a159]/20 border-t-[#b7a159] rounded-full animate-spin"></div>
                  <Icons.BrainCircuit
                    size={24}
                    className="text-[#b7a159] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                </div>
                <span className="text-white/60 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">
                  Deep Context Processing...
                </span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#b7a159] rounded-lg text-white">
                      <Icons.CheckCircle size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase tracking-tighter text-[18px]">
                        Analysis Complete
                      </h4>
                      <p className="text-[#b7a159] text-[9px] font-black uppercase tracking-widest">
                        Document Digest Result
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-white/50 hover:bg-white/10 rounded-lg transition-colors">
                    <Icons.Download size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <section>
                    <h5 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Icons.LayoutList size={14} className="text-[#b7a159]" />{" "}
                      Key Takeaways
                    </h5>
                    <div className="space-y-2">
                      {result?.keyTakeaways.map((item, i) => (
                        <div
                          key={i}
                          className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-start gap-3"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#b7a159] mt-1.5 shrink-0" />
                          <span className="text-white/90 text-[13px] leading-relaxed">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h5 className="text-[11px] font-black text-[#d96245]/80 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Icons.AlertTriangle
                        size={14}
                        className="text-[#d96245]"
                      />{" "}
                      Risks & Compliance Caps
                    </h5>
                    <div className="space-y-2">
                      {result?.risks.map((item, i) => (
                        <div
                          key={i}
                          className="bg-red-500/5 border border-red-500/20 p-3 rounded-xl flex items-start gap-3"
                        >
                          <Icons.ShieldAlert
                            size={16}
                            className="text-[#d96245] shrink-0 mt-0.5"
                          />
                          <span className="text-white/90 text-[13px] leading-relaxed">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h5 className="text-[11px] font-black text-[#657f4d] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Icons.Zap size={14} className="text-[#657f4d]" />{" "}
                      Recommended Actions
                    </h5>
                    <div className="grid grid-cols-1 gap-2">
                      {result?.actionItems.map((item, i) => (
                        <div
                          key={i}
                          className="bg-[#657f4d]/10 border border-[#657f4d]/30 p-3 rounded-xl flex items-center gap-3"
                        >
                          <Icons.Check
                            size={16}
                            className="text-[#657f4d] shrink-0"
                          />
                          <span className="text-white/90 text-[13px]">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
