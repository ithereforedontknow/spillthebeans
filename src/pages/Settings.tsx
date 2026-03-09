import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { PageSpinner } from '@/components/ui/Spinner'
import { profileSchema } from '@/validation'
import { PH_CITIES, WORK_TYPES } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'account'

export function Settings() {
  const { user, profile, updateProfile, logout, loading } = useAuth()
  const toast = useToast()
  const [tab,     setTab]     = useState<Tab>('profile')
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    username:  profile?.username  ?? '',
    bio:       profile?.bio       ?? '',
    city:      profile?.city      ?? '',
    work_type: profile?.work_type ?? '',
  })

  if (loading) return <PageSpinner />
  if (!user)   return <div className="text-center py-20 text-dim font-mono text-sm">Not signed in.</div>

  const handleSave = async () => {
    const parsed = profileSchema.safeParse(form)
    if (!parsed.success) {
      const e: Record<string, string> = {}
      parsed.error.issues.forEach(i => { e[i.path[0] as string] = i.message })
      setErrors(e); return
    }
    setErrors({})
    setSaving(true)
    try {
      await updateProfile(form)
      toast('Profile saved.')
      setEditing(false)
    } catch (err: any) {
      toast(err.message ?? 'Failed to save.', 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-raised">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="font-display text-3xl text-head">Settings</h1>
          <p className="font-mono text-2xs text-dim mt-1">{user.email}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab switcher */}
        <div className="flex gap-1 mb-8 bg-raised rounded-lg p-1 w-fit border border-border">
          {(['profile', 'account'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-5 py-2 rounded text-sm font-medium capitalize transition-all',
                tab === t ? 'bg-card text-head' : 'text-dim hover:text-body')}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-head">Profile</h2>
              <button onClick={() => editing ? setEditing(false) : setEditing(true)} className="btn-secondary btn-sm font-mono">
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="space-y-5">
              <Field label="Username" error={errors.username}>
                <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  disabled={!editing} placeholder="yourhandle" className="input" />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="City" error={errors.city}>
                  <select value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    disabled={!editing} className="input">
                    <option value="">Select city</option>
                    {PH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Work Type" error={errors.work_type}>
                  <select value={form.work_type} onChange={e => setForm(p => ({ ...p, work_type: e.target.value }))}
                    disabled={!editing} className="input">
                    <option value="">Select type</option>
                    {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Bio" error={errors.bio}>
                <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  disabled={!editing} rows={3} placeholder="Short intro about your work style..."
                  maxLength={200} className="input resize-none" />
              </Field>

              {editing && (
                <div className="flex justify-end">
                  <button onClick={handleSave} disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'account' && (
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-display text-lg text-head mb-3">Sign-in method</h3>
              <div className="flex items-center gap-3 p-3 bg-raised rounded border border-border">
                <div className="w-7 h-7 bg-card rounded flex items-center justify-center">
                  <svg viewBox="0 0 24 24" width="16">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-head">Google</p>
                  <p className="font-mono text-2xs text-dim">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="card p-6 border-red-950">
              <h3 className="font-display text-lg text-head mb-1">Sign out</h3>
              <p className="text-sm text-dim mb-4">You will be redirected to the home page.</p>
              <button onClick={logout} className="btn-danger">Sign out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
      {error && <p className="font-mono text-2xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
