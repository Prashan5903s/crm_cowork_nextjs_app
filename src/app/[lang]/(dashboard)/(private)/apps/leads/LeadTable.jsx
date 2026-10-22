'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'

import { useSession } from 'next-auth/react'
import {
  Popover, Card, CardContent, Typography, TextField, Button, Menu, MenuItem, IconButton, Box,
  Table, TableHead, TableBody, TableRow, TableCell, TablePagination, Avatar, Chip
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import * as XLSX from 'xlsx'

import { usePermissionList } from '@/utils/getPermission'
import { getInitials } from '@/utils/getInitials'
import LeadDialog from '@components/dialogs/leads-dialog/page'
import ProposalDialog from '@/components/dialogs/proposal-dialog/page'
import FollowUpTableDialog from '@/components/dialogs/follow_up_table_dialog/page'
import FollowUpDialog from '@/components/dialogs/follow-up-dialog/page'

import CreateLeadDrawer from './CreateLeadDrawer'
import { useApi } from '@/utils/api'

const PROPOSAL_STATUS_ID = '69d5dfb78c890e742280d9c9' // status that allows "Send proposal"
const EMPTY_FILTERS = { search: '', leadStatus: '', leadSource: '', solution: '', converted: '' }

const sourceData = [
  {
    label: "Website",
    value: "website",
  },
  {
    label: "Referral",
    value: "referral",
  },
  {
    label: "Cold Outreach",
    value: "cold_outreach",
  },
  {
    label: "Social Media",
    value: "social_media",
  },
  {
    label: "Walk-in",
    value: "walk_in",
  },
  {
    label: "Advertisement",
    value: "advertisement",
  },
  {
    label: "Facebook",
    value: "facebook",
  },
  {
    label: "Tik tok",
    value: "tik_tok",
  },
  {
    label: "Google ads",
    value: "google_ads",
  },
  {
    label: "Partner",
    value: "partner",
  },
  {
    label: "Other",
    value: "other",
  },
]

const contactMethodData = [
  {
    label: "Email",
    value: "email",
  },
  {
    label: "Phone",
    value: "phone",
  },
  {
    label: "Whatsapp",
    value: "whatsapp",
  },
  {
    label: "Sms",
    value: "sms",
  },
  {
    label: "Chat",
    value: "chat",
  },
]

const priorityData = [
  {
    label: "Urgent",
    value: "urgent",
  },
  {
    label: "Low",
    value: "low",
  },
  {
    label: "Medium",
    value: "medium",
  },
  {
    label: "High",
    value: "high"
  }
]

const formatDate = value => {
  const d = value ? new Date(value) : null

  return d && !isNaN(d) ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
}

const matches = (lead, f) => {
  const s = f.search.trim().toLowerCase()

  return (
    (!s ||
      [lead.name, lead.company_name, lead.email].some(x => x?.toLowerCase().includes(s)) ||
      lead.phone?.includes(s)) &&
    (!f.leadStatus || lead.lead_status_id === f.leadStatus) &&
    (!f.leadSource || lead.source_id === f.leadSource) &&
    (!f.solution || lead.solution_id === f.solution) &&
    (f.converted === '' || Boolean(lead.is_converted) === (f.converted === 'true'))
  )
}

const StatusDot = ({ color, title }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        width: 8,
        height: 8,
        flexShrink: 0,
        borderRadius: '50%',
        bgcolor: color || 'grey.400',
      }}
    />
    <span>{title}</span>
  </Box>
);

/* ---------- filters popover ---------- */
const FilterSelect = ({ label, value, onChange, options }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField select fullWidth size="small" label={label} value={value} onChange={e => onChange(e.target.value)}>
      <MenuItem value="">All</MenuItem>
      {options.map(o => <MenuItem key={o._id ?? o.value} value={o._id ?? o.value}>{o.title}</MenuItem>)}
    </TextField>
  </Grid>
)

const FiltersPanel = ({ draft, setDraft, createData, onApply, onReset }) => {
  const set = k => v => setDraft(p => ({ ...p, [k]: v }))

  return (
    <Box sx={{ p: 4, width: { xs: 300, sm: 640 } }}>
      <Grid container spacing={3}>
        <FilterSelect label="Lead status" value={draft.leadStatus} onChange={set('leadStatus')} options={createData?.statusData || []} />
        <FilterSelect label="Lead source" value={draft.leadSource} onChange={set('leadSource')} options={createData?.sourceData || []} />
        <FilterSelect label="Solution" value={draft.solution} onChange={set('solution')} options={createData?.solutionData || []} />
        <FilterSelect label="Converted" value={draft.converted} onChange={set('converted')}
          options={[{ value: 'true', title: 'Yes' }, { value: 'false', title: 'No' }]} />
        <Grid size={12} sx={{ display: 'flex', gap: 2 }}>
          <Button fullWidth variant="contained" onClick={onApply}>Apply filters</Button>
          <Button fullWidth variant="outlined" onClick={onReset}>Reset</Button>
        </Grid>
      </Grid>
    </Box>
  )
}

/* ---------- list view ---------- */
const ListView = ({ rows, actions }) => {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  useEffect(() => setPage(0), [rows])

  const visible = rows.slice(page * size, page * size + size)

  return (
    <>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Lead', 'Phone', 'Follow up', 'Proposal', 'Avg. monthly consumption', 'Sanctioned load', 'Status', ''].map(h => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">No leads match these filters</TableCell></TableRow>
            )}
            {visible.map(lead => {
              const st = lead.lead_status?.status

              return (
                <TableRow key={lead._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar sx={{ width: 34, height: 34 }}>{getInitials(lead.name || '')}</Avatar>
                      <Box>
                        <Typography fontWeight={500}>{lead.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{lead.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" aria-label="Add follow up" onClick={() => actions.addFollowUp(lead)}><i className="tabler-plus" /></IconButton>
                      <IconButton size="small" aria-label="View follow ups" onClick={() => actions.viewFollowUps(lead)}><i className="tabler-eye" /></IconButton>
                      <Typography variant="body2">{lead.followUp?.length || 0}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {lead.lead_status_id === PROPOSAL_STATUS_ID && (
                      <IconButton size="small" aria-label="Send proposal" onClick={() => actions.sendProposal(lead)}><i className="tabler-send" /></IconButton>
                    )}
                  </TableCell>
                  <TableCell>{lead.average_monthly_consumption}</TableCell>
                  <TableCell>{lead.sanctioned_load}</TableCell>
                  <TableCell><StatusDot color={st?.color} title={st?.title || '—'} /></TableCell>
                  <TableCell>
                    <IconButton size="small" aria-label="Edit lead" onClick={() => actions.edit(lead)}><i className="tabler-edit" /></IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
      <TablePagination
        component="div" count={rows.length} page={page} rowsPerPage={size} rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setSize(+e.target.value); setPage(0) }}
      />
    </>
  )
}

/* ---------- kanban ---------- */
const KanbanCard = ({ lead, color, actions }) => {
  const [anchor, setAnchor] = useState(null)
  const close = () => setAnchor(null)
  const run = fn => () => { close(); fn(lead) }

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1, borderLeft: `4px solid ${color || '#ccc'}`, '&:hover': { boxShadow: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography fontWeight={600}>{lead.name}</Typography>
        <IconButton size="small" aria-label="Lead actions" onClick={e => setAnchor(e.currentTarget)}><i className="tabler-dots-vertical" /></IconButton>
      </Box>
      {lead.email && <Typography variant="body2" color="text.secondary">{lead.email}</Typography>}
      {lead.company_name && <Typography variant="body2">{lead.company_name}</Typography>}
      <Typography variant="body2" sx={{ mt: 1 }}>{lead.phone}</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {lead.followUp?.length || 0} follow up{lead.followUp?.length === 1 ? '' : 's'} • {formatDate(lead.created_at)}
        </Typography>
        {lead.is_converted && <Chip size="small" color="warning" label="Converted" />}
      </Box>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
        <MenuItem onClick={run(actions.addFollowUp)}>Add follow up</MenuItem>
        <MenuItem onClick={run(actions.viewFollowUps)}>View follow ups</MenuItem>
        {lead.lead_status_id === PROPOSAL_STATUS_ID && <MenuItem onClick={run(actions.sendProposal)}>Send proposal</MenuItem>}
        <MenuItem onClick={run(actions.edit)}>Edit</MenuItem>
      </Menu>
    </Box>
  )
}

const KanbanView = ({ groups, onAdd, actions, createData }) => (
  <Box sx={{ display: 'flex', gap: 4, overflowX: 'auto', p: 4 }}>
    {createData?.leadStatus?.map(ld => (
      <Box key={ld?._id} sx={{ minWidth: 280, bgcolor: 'action.hover', borderRadius: 2, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography component={"div"} fontWeight={600}><StatusDot color={ld?.color} title={ld?.name} /></Typography>
          <Chip size="small" label={0} />
        </Box>
        <Button fullWidth size="small" variant="outlined" sx={{ mb: 3 }} onClick={() => onAdd(ld?._id)}>+ Add lead</Button>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 420, overflowY: 'auto', pr: 1 }}>
          {/* {col.leads.length
            ? col.leads.map(l => <KanbanCard key={l._id} lead={l} color={col.status?.color} actions={actions} />)
            : <Typography variant="body2" color="text.secondary" align="center">No cards</Typography>} */}
        </Box>
      </Box>
    ))}
  </Box>
)

export default function LeadTable({
  isTable,
  setIsTable,
  selectLeadStatusId,
  setSelectLeadStatusId,
  tableData,
  fetchLeadsData,
  view,
  setView,
  setLeadsData,
}) {

  const { doGet, token } = useApi()

  const [createData, setCreateData] = useState(null)
  const [draft, setDraft] = useState(EMPTY_FILTERS)     // being edited
  const [applied, setApplied] = useState(EMPTY_FILTERS) // actually applied
  const [filterAnchor, setFilterAnchor] = useState(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUpListOpen, setFollowUpListOpen] = useState(false)
  const [proposalOpen, setProposalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)

  const getPermissions = usePermissionList()
  const [permissions, setPermissions] = useState({})

  useEffect(() => {
    if (!getPermissions) return
    getPermissions().then(setPermissions).catch(e => console.error('Error fetching permissions:', e))
  }, [getPermissions])

  // one fetch of dropdown data, shared by filters + create drawer
  useEffect(() => {

    if (!token) return

    const loadData = async () => {
      try {

        const result = await doGet("company/leads/create/data");

        setCreateData(result)
      } catch (error) {

        throw new Error(error)
      }
    }

    loadData();

  }, [token])

  // Derived, so a refetch after create/edit is never hidden behind stale filtered state
  const filtered = useMemo(() => {
    if (!Array.isArray(tableData)) return []

    return view === 'kanban'
      ? tableData.map(g => ({ ...g, leads: (g.leads || []).filter(l => matches(l, applied)) }))
      : tableData.filter(l => matches(l, applied))
  }, [tableData, applied, view])

  const actions = useMemo(() => ({
    addFollowUp: l => { setSelectedLead(l); setFollowUpOpen(true) },
    viewFollowUps: l => { setSelectedLead(l); setFollowUpListOpen(true) },
    sendProposal: l => { setSelectedLead(l); setProposalOpen(true) },
    edit: l => { setIsTable(view === 'table'); setSelectedLead(l); setEditOpen(true) }
  }), [view, setIsTable])

  const openCreate = useCallback(statusId => {
    setSelectLeadStatusId(statusId)
    setDrawerOpen(true)
  }, [setSelectLeadStatusId])

  const switchView = next => { setLeadsData(null); setIsTable(next === 'table'); setView(next) }

  const exportExcel = () => {
    const leads = view === 'table'
      ? filtered
      : filtered.flatMap(g => g.leads.map(l => ({ ...l, kanban_status: g.status?.title || '' })))

    const rows = leads.map((l, i) => ({
      'S.No': i + 1, Name: l.name || '', Email: l.email || '', Phone: l.phone || '', Company: l.company_name || '',
      'Average monthly consumption': l.average_monthly_consumption ?? '', 'Sanctioned load': l.sanctioned_load ?? '',
      'No. of follow ups': l.followUp?.length || 0,
      'Latest follow up': l.followUp?.length ? formatDate(l.followUp[l.followUp.length - 1]?.follow_up_date) : '',
      Status: view === 'kanban' ? l.kanban_status : l.lead_status?.status?.title || '',
      Source: l.source?.title || '', Solution: l.solution?.title || '',
      Converted: l.is_converted ? 'Yes' : 'No', 'Created at': formatDate(l.created_at)
    }))

    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Leads')
    XLSX.writeFile(wb, 'Leads.xlsx')
  }

  const loaded = Array.isArray(tableData)

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 3 }}>
        <Typography variant="h5">Leads</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<i className="tabler-download" />} onClick={exportExcel} disabled={!loaded}>Export Excel</Button>
          <Button variant="contained" startIcon={<i className="tabler-plus" />} onClick={() => openCreate(undefined)}>Create lead</Button>
        </Box>
      </CardContent>

      <Grid container spacing={2} sx={{ px: 4, pb: 4 }} alignItems="center" justifyContent="space-between">
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              size="small" placeholder="Search leads…" value={draft.search}
              onChange={e => setDraft(p => ({ ...p, search: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && setApplied(draft)}
            />
            <Button variant="contained" startIcon={<i className="tabler-search" />} onClick={() => setApplied(draft)}>Search</Button>
            <Button variant="outlined" color="success" startIcon={<i className="tabler-filter" />} onClick={e => setFilterAnchor(e.currentTarget)}>Filters</Button>
            <Popover open={!!filterAnchor} anchorEl={filterAnchor} onClose={() => setFilterAnchor(null)}>
              <FiltersPanel
                draft={draft} setDraft={setDraft} createData={createData}
                onApply={() => { setApplied(draft); setFilterAnchor(null) }}
                onReset={() => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setFilterAnchor(null) }}
              />
            </Popover>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
          <Button size="small" aria-label="List view" variant={view === 'table' ? 'contained' : 'outlined'} onClick={() => switchView('table')}><i className="tabler-list" /></Button>
          <Button size="small" aria-label="Kanban view" variant={view === 'kanban' ? 'contained' : 'outlined'} onClick={() => switchView('kanban')}><i className="tabler-layout-kanban" /></Button>
        </Grid>
      </Grid>

      {!loaded ? (
        <Typography sx={{ p: 6 }} color="text.secondary" align="center">Loading leads…</Typography>
      ) : view === 'table' ? (
        <Box sx={{ p: 4 }}><ListView createData={createData} rows={filtered} actions={actions} /></Box>
      ) : (
        <KanbanView createData={createData} groups={filtered} onAdd={openCreate} actions={actions} />
      )}

      {drawerOpen && (

        <CreateLeadDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          createData={createData}
          fetchLeadsData={fetchLeadsData}
          onOpenLead={r => { const lead = (view === 'kanban' ? tableData.flatMap(g => g.leads) : tableData).find(l => l._id === r._id); if (lead) actions.edit(lead) }}
        />
      )}

      {editOpen && (
        <LeadDialog
          open={editOpen} setOpen={setEditOpen} isTable={isTable} tableData={tableData}
          selectedLead={selectedLead} selectLeadStatusId={selectLeadStatusId}
          fetchLeadsData={fetchLeadsData} permissionArr={permissions}
        />
      )}
      {followUpOpen && (
        <FollowUpDialog
          open={followUpOpen} setOpen={setFollowUpOpen} tableData={tableData}
          selectedLead={selectedLead} selectedLeadId={selectedLead?._id} fetchLeadsData={fetchLeadsData}
        />
      )}
      {followUpListOpen && (
        <FollowUpTableDialog
          open={followUpListOpen} setOpen={setFollowUpListOpen}
          tableData={selectedLead} selectedLeadId={selectedLead?._id}
        />
      )}
      {proposalOpen && (
        <ProposalDialog
          open={proposalOpen} setOpen={setProposalOpen}
          selectedLead={selectedLead} selectLeadId={selectedLead?._id}
        />
      )}
    </Card>
  )
}
