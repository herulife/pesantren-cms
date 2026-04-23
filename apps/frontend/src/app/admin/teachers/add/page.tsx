import { redirect } from 'next/navigation';

export default function AddTeacherRedirectPage() {
	redirect('/admin/teachers?mode=create');
}
