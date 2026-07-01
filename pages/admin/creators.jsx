import { AdminCreatorsPage } from '../../src/screens/AdminCreatorsPage';

export async function getServerSideProps({ req }) {
  const adminKey = req.cookies['cm-admin-key'];

  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return {
      redirect: {
        destination: '/admin/creators-login',
        permanent: false,
      },
    };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  try {
    const res = await fetch(`${apiUrl}/creator-applications`, {
      headers: { 'x-admin-key': adminKey },
    });
    const json = await res.json();
    const applications = json.data || [];
    return { props: { applications } };
  } catch (err) {
    console.error('[admin/creators] Failed to fetch applications:', err);
    return { props: { applications: [] } };
  }
}

export default function AdminCreatorsRoute({ applications }) {
  return <AdminCreatorsPage applications={applications} />;
}
