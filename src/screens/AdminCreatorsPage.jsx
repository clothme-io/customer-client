import Head from 'next/head';
import { CreatorApplicationsTable } from '../components/admin/CreatorApplicationsTable';

export function AdminCreatorsPage({ applications }) {
  return (
    <>
      <Head>
        <title>Creator Applications — ClothME Admin</title>
      </Head>
      <div className="admin-creators-page">
        <header className="admin-creators-topbar">
          <span className="admin-creators-brand">ClothME Admin</span>
          <nav className="admin-creators-nav">
            <a href="/admin/cms">CMS</a>
            <a href="/admin/creators" className="admin-nav-active">Creators</a>
          </nav>
        </header>
        <main className="admin-creators-main">
          <CreatorApplicationsTable applications={applications} />
        </main>
      </div>
    </>
  );
}
