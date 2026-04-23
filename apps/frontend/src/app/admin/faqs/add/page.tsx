import { redirect } from 'next/navigation';

export default function AddFaqRedirectPage() {
	redirect('/admin/faqs?mode=create');
}
