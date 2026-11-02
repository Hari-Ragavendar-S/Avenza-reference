import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client'
import PageHeader from '../../components/PageHeader'
import { formatIST } from '../../utils/dateFormatter'

const DOC_TYPES = [
  { key: 'aadhaar', label: 'Aadhaar Card', requires_back: true, hint: 'Front and back of your Aadhaar card' },
  { key: 'pan', label: 'PAN Card', requires_back: false, hint: 'Front of your PAN card only' },
  { key: 'driving_licence', label: 'Driving Licence', requires_back: true, hint: 'Front and back of your driving licence' },
  { key: 'voter_id', label: 'Voter ID', requires_back: true, hint: 'Front and back of your Voter ID card' },
  { key: 'passport', label: 'Passport', requires_back: true, hint: 'Photo page (front) and address page (back)' },
]

const STATUS_STYLE = {
  not_submitted: { label: 'Not Submitted', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30' },
  pending: { label: 'Under Review', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
}

export default function UserKYC() {
  const [kycData, setKycData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [docTypes, setDocTypes] = useState(DOC_TYPES)

  // Form state
  const [step, setStep] = useState('form') // 'form' | 'confirm' | 'success'
  const [docType, setDocType] = useState('aadhaar')
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const frontRef = useRef()
  const backRef = useRef()

  const selectedDoc = docTypes.find(d => d.key === docType) || docTypes[0]

  const load = async () => {
    setLoading(true)
    try {
      const [status, types] = await Promise.all([
        api.get('/kyc/my'),
        api.get('/kyc/document-types', false),
      ])
      setKycData(status)
      if (types?.length) setDocTypes(types)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleFile = (file, side) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      if (side === 'front') { setFrontFile(file); setFrontPreview(e.target.result) }
      else { setBackFile(file); setBackPreview(e.target.result) }
    }
    reader.readAsDataURL(file)
  }

  const canProceed = frontFile && (!selectedDoc.requires_back || backFile)

  const submitKYC = async () => {
    setSubmitting(true); setError('')
    try {
      const fd = new FormData()
      fd.append('document_type', docType)
      fd.append('front_image', frontFile)
      if (backFile) fd.append('back_image', backFile)
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.fxuniverse.live/api/v1'}/kyc/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('fxu_access_token')}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Submission failed')
      setStep('success')
      load()
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  const reset = () => {
    setStep('form'); setFrontFile(null); setBackFile(null)
    setFrontPreview(null); setBackPreview(null); setError('')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const status = kycData?.status || 'not_submitted'
  const kyc = kycData?.kyc
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.not_submitted

  return (
    <div className="space-y-6">
      <PageHeader title="KYC Verification" subtitle="Verify your identity to unlock all features" />

      {/* Current status banner */}
      <div className={`rounded-2xl p-4 border flex items-start gap-3 ${statusStyle.bg}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusStyle.bg}`}>
          {status === 'approved' && <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          {status === 'pending' && <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          {status === 'rejected' && <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          {status === 'not_submitted' && <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${statusStyle.color}`}>KYC Status: {statusStyle.label}</p>
          {status === 'rejected' && kyc?.rejection_reason && (
            <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-xs font-medium mb-1">Rejection Reason:</p>
              <p className="text-slate-300 text-sm">{kyc.rejection_reason}</p>
              <p className="text-slate-500 text-xs mt-1">Please resubmit with the correct documents.</p>
            </div>
          )}
          {status === 'pending' && <p className="text-slate-400 text-xs mt-0.5">Your documents are under review. Usually takes 24–48 hours.</p>}
          {status === 'approved' && <p className="text-slate-400 text-xs mt-0.5">Your identity has been verified. Submitted: {formatIST(kyc?.submitted_at)}</p>}
        </div>
      </div>

      {/* Show form if not approved or if rejected (resubmit) */}
      {(status === 'not_submitted' || status === 'rejected') && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden">
          {/* Step indicator */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {[
                { label: 'Select Document', step: 'form' },
                { label: 'Upload Photos', step: 'form' },
                { label: 'Confirm & Submit', step: 'confirm' }
              ].map((s, i) => {
                const stepIdx = step === 'form' ? 0 : step === 'confirm' ? 1 : 2
                const done = i < stepIdx
                const active = i === stepIdx
                return (
                  <div key={s.label} className="flex items-center gap-2 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs hidden sm:block ${active ? 'text-white font-medium' : done ? 'text-emerald-400' : 'text-slate-600'}`}>{s.label}</span>
                    {i < 2 && <div className="flex-1 h-px bg-slate-800 hidden sm:block" />}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

            {/* STEP: form */}
            {step === 'form' && (
              <div className="space-y-5">
                <div>
                  <label className="text-slate-400 text-xs mb-2 block font-medium">Select Document Type</label>
                  <select 
                    value={docType} 
                    onChange={(e) => { setDocType(e.target.value); setBackFile(null); setBackPreview(null) }}
                    className="w-full bg-[#1a2035] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {docTypes.map(d => (
                      <option key={d.key} value={d.key}>{d.label} ({d.requires_back ? 'Front + Back' : 'Front only'})</option>
                    ))}
                  </select>
                  <p className="text-slate-500 text-xs mt-2">{selectedDoc.hint}</p>
                </div>

                {/* Front upload */}
                <div>
                  <label className="text-slate-400 text-xs mb-2 block font-medium">Front Side *</label>
                  <input ref={frontRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => handleFile(e.target.files[0], 'front')} />
                  {frontPreview ? (
                    <div className="relative">
                      <img src={frontPreview} alt="Front" className="w-full max-h-48 object-cover rounded-xl border border-slate-700" />
                      <button onClick={() => { setFrontFile(null); setFrontPreview(null) }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => frontRef.current.click()}
                      className="w-full border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors">
                      <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <div className="text-center">
                        <p className="text-slate-300 text-sm font-medium">Tap to upload or take photo</p>
                        <p className="text-slate-500 text-xs mt-0.5">JPG, PNG — clear and readable</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Back upload */}
                {selectedDoc.requires_back && (
                  <div>
                    <label className="text-slate-400 text-xs mb-2 block font-medium">Back Side *</label>
                    <input ref={backRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => handleFile(e.target.files[0], 'back')} />
                    {backPreview ? (
                      <div className="relative">
                        <img src={backPreview} alt="Back" className="w-full max-h-48 object-cover rounded-xl border border-slate-700" />
                        <button onClick={() => { setBackFile(null); setBackPreview(null) }}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => backRef.current.click()}
                        className="w-full border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors">
                        <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <div className="text-center">
                          <p className="text-slate-300 text-sm font-medium">Tap to upload or take photo</p>
                          <p className="text-slate-500 text-xs mt-0.5">Back side of {selectedDoc.label}</p>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                <button onClick={() => setStep('confirm')} disabled={!canProceed}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
                  Review & Confirm →
                </button>
              </div>
            )}

            {/* STEP: confirm */}
            {step === 'confirm' && (
              <div className="space-y-5">
                <div className="bg-[#1a2035] rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Document Type</span><span className="text-white font-semibold">{selectedDoc.label}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Photos</span><span className="text-white">{selectedDoc.requires_back ? 'Front + Back' : 'Front only'}</span></div>
                </div>

                <div className={`grid gap-4 ${selectedDoc.requires_back ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <p className="text-slate-400 text-xs mb-2">Front</p>
                    <img src={frontPreview} alt="Front" className="w-full rounded-xl border border-slate-700 object-cover max-h-40" />
                  </div>
                  {selectedDoc.requires_back && backPreview && (
                    <div>
                      <p className="text-slate-400 text-xs mb-2">Back</p>
                      <img src={backPreview} alt="Back" className="w-full rounded-xl border border-slate-700 object-cover max-h-40" />
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-blue-300 text-xs">Make sure all text is clearly visible and the document is not expired. Blurry or cropped images will be rejected.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('form')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-colors text-sm">← Back</button>
                  <button onClick={submitKYC} disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                    {submitting ? 'Submitting...' : 'Submit KYC'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP: success */}
            {step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-9 h-9 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-white font-bold text-lg">KYC Submitted!</h3>
                <p className="text-slate-400 text-sm">Your documents are under review. We'll notify you within 24–48 hours.</p>
                <button onClick={reset} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      {status !== 'approved' && (
        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Tips for Successful Verification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '💡', text: 'Ensure good lighting — avoid shadows on the document' },
              { icon: '📐', text: 'Keep the document flat and fully visible in the frame' },
              { icon: '🔍', text: 'All text must be sharp and readable — no blur' },
              { icon: '✅', text: 'Document must be valid and not expired' },
            ].map(t => (
              <div key={t.text} className="flex items-start gap-3 p-3 bg-[#1a2035] rounded-xl">
                <span className="text-lg flex-shrink-0">{t.icon}</span>
                <p className="text-slate-300 text-xs leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
