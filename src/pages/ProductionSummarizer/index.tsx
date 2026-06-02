import React, { useState } from "react";
import * as Icons from "lucide-react";
import UserGuideButton from "@/src/components/shared/UserGuideButton";
import { UserGuidePanel } from "@/src/components/shared/UserGuidePanel";

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
        title="SUMMARIZER GUIDE"
        subtitle="AI PRODUCTION SUMMARIZER MANUAL"
      >
        <div className="space-y-8 font-sans">
            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.FileText size={16} className="text-[#b58c4f]" /> 1. การนำเข้าข้อมูล (DATA INPUT)
                </h3>
                <p className="mb-4 text-[#414757]">
                    คัดลอกและวางเนื้อหา ประกาศ หรือร่างข้อกำหนดทางกฎหมายที่ยาวและซับซ้อน เพื่อให้ AI ช่วยสรุปใจความสำคัญและดึงข้อมูลออกมาให้:
                </p>
                <div className="space-y-3">
                    <div className="p-3 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl flex items-start gap-4 text-[12px]">
                        <div className="bg-[#3f809e] text-white p-2 rounded-lg shrink-0"><Icons.Copy size={16} /></div>
                        <div>
                            <strong className="text-[#212c46]">Paste Text</strong>
                            <p className="text-[#7a8b95]">รองรับการวาง Text ปริมาณมาก รวมถึงประกาศของบริษัทหรือนโยบายใหม่</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.BrainCircuit size={16} className="text-[#a94228]" /> 2. การวิเคราะห์อัจฉริยะ (SMART ANALYSIS)
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#688a58]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Executive Summary</strong> - สรุปใจความสำคัญแบบกระชับไม่กี่บรรทัด</span></div>
                    <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#a94228]"></div><span className="text-[#414757] text-[12px]"><strong className="text-[#212c46]">Risk Identification</strong> - ระบุความเสี่ยงและจุดอ่อนจากเอกสาร</span></div>
                </div>
            </div>

            <div className="h-px bg-[#eaeaec] w-full" />

            <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#212c46] flex items-center gap-2 mb-4">
                    <Icons.Zap size={16} className="text-[#3f809e]" /> 3. แนวทางการปฏิบัติ (ACTION ITEMS)
                </h3>
                <div className="p-4 bg-[#e8f1f5] border border-[#d1e6ee] rounded-xl text-[#3f809e] text-[12px]">
                    ระบบจะเสนอแนะขั้นตอนถัดไป (Next Steps) เพื่อให้คุณนำไปเปิด Ticket งานต่อ หรือส่งต่อพนักงานคุมเครื่องจักรได้อย่างมีประสิทธิภาพสูงสุด
                </div>
            </div>
        </div>
      </UserGuidePanel>

      {/* HEADER SECTION */}
      <div className="h-14 px-4 sm:px-8 flex flex-row items-center justify-between gap-4 z-20 shrink-0">
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

      <div className="mx-auto px-4 sm:px-8 w-full mt-[2px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Input Card */}
          <div className="bg-white/90 p-6 rounded-xl shadow-lg border border-[#eaeaec] animate-fadeIn">
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
                className="w-full h-80 p-5 bg-[#f8f9fa] border border-[#eaeaec] rounded-xl outline-none focus:border-[#b58c4f] focus:ring-2 focus:ring-[#b58c4f]/10 transition-all text-[#212c46] text-[14px] leading-relaxed resize-none"
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
              className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-widest text-[12px] transition-all flex items-center justify-center gap-3 shadow-md ${!inputText.trim() || isProcessing ? "bg-[#eaeaec] text-[#a0aec0] cursor-not-allowed" : "bg-[#212c46] text-[#b7a159] hover:bg-[#b7a159] hover:text-[#212c46]"}`}
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
          <div className="bg-[#1d2636] p-6 rounded-xl shadow-xl border border-[#414757] animate-fadeIn min-h-[500px] flex flex-col">
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
