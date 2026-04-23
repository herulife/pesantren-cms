import { redirect } from 'next/navigation';

export default function AddVideoRedirectPage() {
	redirect('/admin/videos?mode=create');
}
