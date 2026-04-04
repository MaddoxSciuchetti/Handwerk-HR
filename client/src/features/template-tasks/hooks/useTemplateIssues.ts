import { useMutation } from '@tanstack/react-query';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { templateV2Mutations } from '../query-options/mutations/templateV2.mutations';
import { templateV2Queries } from '../query-options/queries/templateV2.queries';

function useTemplateIssues(templateId: string) {
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { data, isPending, isError } = useQuery(
    templateV2Queries.detail(templateId)
  );
  const { mutate: createItem, isPending: isCreating } = useMutation(
    templateV2Mutations.createItem(templateId)
  );
  const { mutate: deleteItem } = useMutation(
    templateV2Mutations.deleteItem(templateId)
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    createItem(
      {
        title: trimmedTitle,
        description: description.trim() || undefined,
        orderIndex: data?.items?.length ?? 0,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setAddOpen(false);
        },
      }
    );
  };

  return {
    data,
    isPending,
    isError,
    createItem,
    deleteItem,
    isCreating,
    addOpen,
    setAddOpen,
    title,
    setTitle,
    description,
    setDescription,
    handleAddItem,
  };
}

export default useTemplateIssues;
