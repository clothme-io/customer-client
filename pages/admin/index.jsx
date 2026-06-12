export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/admin/cms",
      permanent: false
    }
  };
}

export default function AdminIndexPage() {
  return null;
}
