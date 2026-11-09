import React from 'react';

interface ExecutiveReportSignatureBlockProps {
  signLayout: '2_COL' | '3_COL' | '1_COL';
  leftPrefix: string;
  setLeftPrefix: (val: string) => void;
  leftTitle: string;
  setLeftTitle: (val: string) => void;
  leftName: string;
  setLeftName: (val: string) => void;
  leftId: string;
  setLeftId: (val: string) => void;

  showStampBox: boolean;

  signCity: string;
  setSignCity: (val: string) => void;
  signDate: string;
  setSignDate: (val: string) => void;
  rightTitle: string;
  setRightTitle: (val: string) => void;
  rightName: string;
  setRightName: (val: string) => void;
  rightId: string;
  setRightId: (val: string) => void;

  centerPrefix: string;
  setCenterPrefix: (val: string) => void;
  centerTitle: string;
  setCenterTitle: (val: string) => void;
  centerName: string;
  setCenterName: (val: string) => void;
  centerId: string;
  setCenterId: (val: string) => void;

  setIsSignManuallyEdited: (val: boolean) => void;
}

export const ExecutiveReportSignatureBlock: React.FC<ExecutiveReportSignatureBlockProps> = ({
  signLayout,
  leftPrefix,
  setLeftPrefix,
  leftTitle,
  setLeftTitle,
  leftName,
  setLeftName,
  leftId,
  setLeftId,

  showStampBox,

  signCity,
  setSignCity,
  signDate,
  setSignDate,
  rightTitle,
  setRightTitle,
  rightName,
  setRightName,
  rightId,
  setRightId,

  centerPrefix,
  setCenterPrefix,
  centerTitle,
  setCenterTitle,
  centerName,
  setCenterName,
  centerId,
  setCenterId,

  setIsSignManuallyEdited,
}) => {
  return (
    <div className="print-break-inside-avoid mt-8 pt-5 border-t border-slate-300">
      <div className="no-print mb-3 text-[11px] text-slate-500">
        Klik langsung pada jabatan atau nama di bawah ini untuk mengetik manual sebelum cetak:
      </div>

      <div
        className={`grid grid-cols-1 ${
          signLayout === '1_COL'
            ? 'sm:grid-cols-1 print:grid-cols-1 justify-items-end'
            : 'sm:grid-cols-3 print:grid-cols-3'
        } items-start gap-6 text-xs text-slate-900`}
      >
        {/* LEFT SIGNATORY */}
        {signLayout !== '1_COL' && (
          <div className="text-center w-full flex flex-col items-center">
            <input
              type="text"
              value={leftPrefix}
              onChange={(e) => {
                setLeftPrefix(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              placeholder="Mengetahui,"
              className="w-full text-center text-xs text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
            />
            <input
              type="text"
              value={leftTitle}
              onChange={(e) => {
                setLeftTitle(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              placeholder="JABATAN PEJABAT KIRI"
              className="w-full text-center font-bold uppercase text-xs text-slate-950 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
            />

            <div className="h-20 sm:h-24 print:h-22 w-full" />

            <input
              type="text"
              value={leftName}
              onChange={(e) => {
                setLeftName(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              placeholder="( Ketik Nama Pejabat Kiri )"
              className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
            />
            {!leftName.trim() && (
              <div className="hidden print:block font-bold text-slate-700 tracking-widest">
                ( .................................................... )
              </div>
            )}
            <input
              type="text"
              value={leftId}
              onChange={(e) => {
                setLeftId(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              placeholder="Ketik No. e-KTA / NIK (Opsional)"
              className="w-full text-center text-[11px] font-mono text-slate-600 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
            />
          </div>
        )}

        {/* CENTER STAMP AREA */}
        {signLayout !== '1_COL' && (
          <div className="flex flex-col items-center justify-center w-full my-auto">
            {showStampBox && (
              <div className="w-24 h-24 rounded-full border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-2 text-[9px] text-slate-400 font-mono select-none">
                <span>STEMPEL</span>
                <span>ORGANISASI</span>
              </div>
            )}
          </div>
        )}

        {/* RIGHT SIGNATORY */}
        <div
          className={`text-center ${
            signLayout === '1_COL' ? 'w-72 ml-auto' : 'w-full'
          } flex flex-col items-center`}
        >
          <div className="flex items-center justify-center gap-1 w-full">
            <input
              type="text"
              value={signCity}
              onChange={(e) => {
                setSignCity(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              className="w-24 text-right text-xs text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
            />
            <span>,</span>
            <input
              type="text"
              value={signDate}
              onChange={(e) => {
                setSignDate(e.target.value);
                setIsSignManuallyEdited(true);
              }}
              className="w-36 text-left text-xs text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
            />
          </div>
          <input
            type="text"
            value={rightTitle}
            onChange={(e) => {
              setRightTitle(e.target.value);
              setIsSignManuallyEdited(true);
            }}
            placeholder="JABATAN PEJABAT KANAN"
            className="w-full text-center font-bold uppercase text-xs text-slate-950 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none"
          />

          <div className="h-20 sm:h-24 print:h-22 w-full" />

          <input
            type="text"
            value={rightName}
            onChange={(e) => {
              setRightName(e.target.value);
              setIsSignManuallyEdited(true);
            }}
            placeholder="( Ketik Nama Pejabat Kanan )"
            className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
          />
          {!rightName.trim() && (
            <div className="hidden print:block font-bold text-slate-700 tracking-widest">
              ( .................................................... )
            </div>
          )}
          <input
            type="text"
            value={rightId}
            onChange={(e) => {
              setRightId(e.target.value);
              setIsSignManuallyEdited(true);
            }}
            placeholder="Ketik No. e-KTA / NIK (Opsional)"
            className="w-full text-center text-[11px] font-mono text-slate-600 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:bg-slate-50 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
          />
        </div>
      </div>

      {signLayout === '3_COL' && (
        <div className="mt-8 pt-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto text-xs">
          <input
            type="text"
            value={centerPrefix}
            onChange={(e) => setCenterPrefix(e.target.value)}
            className="w-full text-center text-xs text-slate-700 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:outline-none print:border-none"
          />
          <input
            type="text"
            value={centerTitle}
            onChange={(e) => setCenterTitle(e.target.value)}
            className="w-full text-center font-bold uppercase text-xs text-slate-950 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:outline-none print:border-none"
          />
          <div className="h-20 print:h-20 w-full" />
          <input
            type="text"
            value={centerName}
            onChange={(e) => setCenterName(e.target.value)}
            placeholder="( Ketik Nama Pejabat Tengah )"
            className="w-full text-center font-bold underline text-sm text-slate-950 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-600 focus:border-slate-900 focus:outline-none print:border-none placeholder:text-slate-400 print:placeholder:text-transparent"
          />
          {!centerName.trim() && (
            <div className="hidden print:block font-bold text-slate-700 tracking-widest">
              ( .................................................... )
            </div>
          )}
          <input
            type="text"
            value={centerId}
            onChange={(e) => setCenterId(e.target.value)}
            placeholder="Ketik No. e-KTA / NIK (Opsional)"
            className="w-full text-center text-[11px] font-mono text-slate-600 mt-0.5 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-600 focus:outline-none print:border-none placeholder:text-slate-300 print:placeholder:text-transparent"
          />
        </div>
      )}
    </div>
  );
};

