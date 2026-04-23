import { redirect } from 'next/navigation';

export default function AddFacilityRedirectPage() {
	redirect('/admin/facilities?mode=create');
}
