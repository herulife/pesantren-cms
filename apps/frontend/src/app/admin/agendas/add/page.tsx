import { redirect } from 'next/navigation';

export default function AddAgendaRedirectPage() {
	redirect('/admin/agendas?mode=create');
}
