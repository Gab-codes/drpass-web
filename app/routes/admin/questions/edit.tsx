import { useParams } from "react-router";

export default function EditQuestion() {
  const params = useParams();
  return <h1>Edit Question {params.questionId}</h1>;
}
