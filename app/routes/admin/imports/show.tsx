import { useParams } from "react-router";

export default function ShowImport() {
  const params = useParams();
  return <h1>Import {params.importId}</h1>;
}
