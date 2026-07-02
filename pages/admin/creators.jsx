import { AdminCreatorsPage } from '../../src/screens/AdminCreatorsPage';
import { backendApiUrl } from '../../src/lib/backendApi';

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

  try {
    const res = await fetch(backendApiUrl('/creator-applications'), {
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
