import { useEffect, useState } from 'react';
import './app.css';

const STORAGE_KEY = 'study-space-assignments';

function dateOffset(days) {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const starterAssignments = [
	{ id: 'a1', title: 'Read chapter 6 and annotate', subject: 'Biology', dueDate: dateOffset(0), priority: 'High', completed: false },
	{ id: 'a2', title: 'Problem set: derivatives', subject: 'Calculus', dueDate: dateOffset(1), priority: 'Medium', completed: false },
	{ id: 'a3', title: 'Draft the opening paragraph', subject: 'English', dueDate: dateOffset(4), priority: 'Low', completed: false },
	{ id: 'a4', title: 'Review lecture notes', subject: 'History', dueDate: '', priority: 'Medium', completed: true },
];

function getInitialAssignments() {
	try {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		return saved ? JSON.parse(saved) : starterAssignments;
	} catch {
		return starterAssignments;
	}
}

function formatDate(dateString) {
	if (!dateString) return 'No deadline';
	const date = new Date(`${dateString}T00:00:00`);
	return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function getDateGroup(assignment, today) {
	if (!assignment.dueDate) return 'Unscheduled';
	if (assignment.dueDate < today) return 'Overdue';
	if (assignment.dueDate === today) return 'Due today';
	return 'Coming up';
}

function App() {
	const [assignments, setAssignments] = useState(getInitialAssignments);
	const [view, setView] = useState('All work');
	const [editingId, setEditingId] = useState(null);
	const [form, setForm] = useState({ title: '', subject: '', dueDate: '', priority: 'Medium', completed: false });

	useEffect(() => {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
	}, [assignments]);

	const today = dateOffset(0);
	const activeAssignments = assignments.filter((assignment) => !assignment.completed);
	const completedAssignments = assignments.filter((assignment) => assignment.completed);
	const dueTodayCount = activeAssignments.filter((assignment) => assignment.dueDate === today).length;
	const dueSoonCount = activeAssignments.filter((assignment) => assignment.dueDate > today).length;

	function resetForm() {
		setForm({ title: '', subject: '', dueDate: '', priority: 'Medium', completed: false });
		setEditingId(null);
	}

	function submitAssignment(event) {
		event.preventDefault();
		const nextAssignment = { ...form, title: form.title.trim(), subject: form.subject.trim() };
		if (editingId) {
			setAssignments((current) => current.map((assignment) => assignment.id === editingId ? { ...assignment, ...nextAssignment } : assignment));
		} else {
			setAssignments((current) => [{ ...nextAssignment, id: `${Date.now()}-${Math.random()}` }, ...current]);
		}
		resetForm();
	}

	function editAssignment(assignment) {
		setForm({ title: assignment.title, subject: assignment.subject, dueDate: assignment.dueDate, priority: assignment.priority, completed: assignment.completed });
		setEditingId(assignment.id);
		document.querySelector('.assignment-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	function toggleComplete(id) {
		setAssignments((current) => current.map((assignment) => assignment.id === id ? { ...assignment, completed: !assignment.completed } : assignment));
	}

	function deleteAssignment(id) {
		setAssignments((current) => current.filter((assignment) => assignment.id !== id));
		if (editingId === id) resetForm();
	}

	function getVisibleGroups() {
		if (view === 'Completed') return [{ title: 'Finished', assignments: completedAssignments }];
		if (view === 'Today') {
			return [
				{ title: 'Overdue', assignments: activeAssignments.filter((assignment) => getDateGroup(assignment, today) === 'Overdue') },
				{ title: 'Due today', assignments: activeAssignments.filter((assignment) => getDateGroup(assignment, today) === 'Due today') },
			];
		}
		if (view === 'Coming up') {
			return [
				{ title: 'Coming up', assignments: activeAssignments.filter((assignment) => getDateGroup(assignment, today) === 'Coming up') },
				{ title: 'Unscheduled', assignments: activeAssignments.filter((assignment) => getDateGroup(assignment, today) === 'Unscheduled') },
			];
		}
		return [
			{ title: 'Overdue', assignments: activeAssignments.filter((assignment) => getDateGroup(assignment, today) === 'Overdue') },
			{ title: 'Due today', assignments: activeAssignments.filter((assignment) => getDateGroup(assignment, today) === 'Due today') },
			{ title: 'Coming up', assignments: activeAssignments.filter((assignment) => getDateGroup(assignment, today) === 'Coming up') },
			{ title: 'Unscheduled', assignments: activeAssignments.filter((assignment) => getDateGroup(assignment, today) === 'Unscheduled') },
			{ title: 'Finished', assignments: completedAssignments },
		];
	}

	const groups = getVisibleGroups();
	const visibleCount = groups.reduce((total, group) => total + group.assignments.length, 0);

	return (
		<div className="workspace-shell">
			<aside className="sidebar">
				<a className="brand" href="#top" aria-label="Study Space home">
					<span className="brand-mark">S<span>.</span></span>
					<span className="brand-name">studyspace</span>
				</a>

				<div className="sidebar-label">Workspace</div>
				<nav className="side-nav" aria-label="Assignment views">
					{[
						{ name: 'All work', symbol: '▤', count: assignments.length },
						{ name: 'Today', symbol: '◷', count: dueTodayCount },
						{ name: 'Coming up', symbol: '↗', count: dueSoonCount },
						{ name: 'Completed', symbol: '✓', count: completedAssignments.length },
					].map((item) => (
						<button key={item.name} className={`nav-item ${view === item.name ? 'selected' : ''}`} onClick={() => setView(item.name)}>
							<span className="nav-symbol" aria-hidden="true">{item.symbol}</span>
							<span>{item.name}</span>
							<span className="nav-count">{item.count}</span>
						</button>
					))}
				</nav>

				<div className="sidebar-note">
					<span className="note-spark" aria-hidden="true">✳</span>
					<p>Small steps add up.</p>
					<span>Keep your next one in view.</span>
				</div>
				<div className="sidebar-footer"><span className="avatar">S</span><span>My study space</span><span className="footer-dots">•••</span></div>
			</aside>

			<main className="main-content" id="top">
				<header className="topbar">
					<div className="breadcrumb">Workspace <span>/</span> Assignments</div>
					<div className="today-date">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</div>
				</header>

				<section className="page-intro">
					<div>
						<p className="eyebrow">YOUR PERSONAL STUDY DESK</p>
						<h1>Make room to <em>focus.</em></h1>
						<p className="intro-copy">A clear view of what’s due, what’s next, and what you’ve already done.</p>
					</div>
					<div className="intro-mark" aria-hidden="true"><span>✳</span></div>
				</section>

				<section className="summary-strip" aria-label="Assignment summary">
					<div className="summary-item"><span className="summary-number">{activeAssignments.length}</span><span className="summary-label">in progress</span></div>
					<div className="summary-divider" />
					<div className="summary-item"><span className="summary-number">{dueTodayCount}</span><span className="summary-label">due today</span></div>
					<div className="summary-divider" />
					<div className="summary-item"><span className="summary-number">{completedAssignments.length}</span><span className="summary-label">completed</span></div>
					<div className="summary-message">One thing at a time <span aria-hidden="true">↗</span></div>
				</section>

				<div className="content-grid">
					<section className="assignment-column" aria-label="Assignments">
						<div className="list-heading">
							<div>
								<p className="eyebrow">YOUR PLAN</p>
								<h2>{view === 'All work' ? 'Assignments' : view}</h2>
							</div>
							<span className="result-count">{visibleCount} {visibleCount === 1 ? 'item' : 'items'}</span>
						</div>

						<div className="assignment-groups">
							{groups.map((group) => group.assignments.length > 0 && (
								<section className="assignment-group" key={group.title}>
									<div className="group-heading">
										<h3>{group.title}</h3>
										<span>{group.assignments.length}</span>
									</div>
									<div className="assignment-list">
										{group.assignments
											.slice()
											.sort((first, second) => (first.dueDate || '9999').localeCompare(second.dueDate || '9999'))
											.map((assignment) => (
												<article className={`assignment-row ${assignment.completed ? 'is-complete' : ''}`} key={assignment.id}>
													<button className="complete-control" aria-label={assignment.completed ? `Mark ${assignment.title} incomplete` : `Complete ${assignment.title}`} onClick={() => toggleComplete(assignment.id)}>
														{assignment.completed && <span aria-hidden="true">✓</span>}
													</button>
													<div className="assignment-details">
														<h4>{assignment.title}</h4>
														<div className="assignment-meta"><span>{assignment.subject}</span><span className="meta-dot">·</span><span>{formatDate(assignment.dueDate)}</span></div>
													</div>
													<span className={`priority priority-${assignment.priority.toLowerCase()}`}>{assignment.priority}</span>
													<div className="row-actions">
														<button aria-label={`Edit ${assignment.title}`} title="Edit assignment" onClick={() => editAssignment(assignment)}>Edit</button>
														<button aria-label={`Delete ${assignment.title}`} title="Delete assignment" onClick={() => deleteAssignment(assignment.id)}>×</button>
													</div>
												</article>
											))}
									</div>
								</section>
							))}
							{visibleCount === 0 && (
								<div className="empty-state">
									<span aria-hidden="true">✳</span>
									<h3>Nothing on this list.</h3>
									<p>Add an assignment or switch to another view.</p>
								</div>
							)}
						</div>
					</section>

					<aside className="form-panel">
						<div className="form-heading">
							<div className="form-icon" aria-hidden="true">{editingId ? '↻' : '+'}</div>
							<div><p className="eyebrow">PLAN AHEAD</p><h2>{editingId ? 'Edit assignment' : 'Add assignment'}</h2></div>
						</div>
						<form className="assignment-form" onSubmit={submitAssignment}>
							<label className="field-label" htmlFor="assignment-title">Assignment</label>
							<input id="assignment-title" type="text" placeholder="e.g. Finish lab report" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required maxLength={90} />

							<label className="field-label" htmlFor="assignment-subject">Subject</label>
							<input id="assignment-subject" type="text" placeholder="e.g. Chemistry" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required maxLength={40} />

							<div className="form-two-col">
								<div>
									<label className="field-label" htmlFor="assignment-deadline">Deadline</label>
									<input id="assignment-deadline" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
								</div>
								<div>
									<label className="field-label" htmlFor="assignment-priority">Priority</label>
									<select id="assignment-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
										<option>Low</option><option>Medium</option><option>High</option>
									</select>
								</div>
							</div>

							<label className="status-toggle">
								<input type="checkbox" checked={form.completed} onChange={(event) => setForm({ ...form, completed: event.target.checked })} />
								<span className="toggle-box" aria-hidden="true">✓</span>
								<span>Already completed</span>
							</label>
							<div className="form-actions">
								{editingId && <button className="cancel-button" type="button" onClick={resetForm}>Cancel</button>}
								<button className="submit-button" type="submit">{editingId ? 'Save changes' : 'Add to plan'} <span aria-hidden="true">↗</span></button>
							</div>
						</form>
						<div className="form-footnote"><span aria-hidden="true">⌁</span> Your assignments stay saved in this browser.</div>
					</aside>
				</div>
				<footer className="page-footer"><span>STUDYSPACE</span><span>Do your best. The rest will follow.</span></footer>
			</main>
		</div>
	);
}

export default App;
