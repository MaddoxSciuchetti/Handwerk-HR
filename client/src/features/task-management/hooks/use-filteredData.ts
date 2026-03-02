import { getUser } from '@/features/auth/api/auth.api';
import { DescriptionFieldResponse } from '@/types/api.types';
import { useState } from 'react';

function useFilteredData(data: DescriptionFieldResponse | undefined) {
  const [descriptionSearch, setDescriptionSearch] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showMyItems, setShowMyItems] = useState(false);

  const getFilterAndSortedData = () => {
    let filteredData = data?.form.fields ?? [];

    if (descriptionSearch) {
      filteredData = filteredData.filter((field) =>
        field.description
          .toLowerCase()
          .includes(descriptionSearch.toLowerCase())
      );
    }

    if (showMyItems && currentUser) {
      filteredData = filteredData.filter((field) => {
        return field.owner_id === currentUser;
      });
    }

    const sortedData = [...filteredData].sort((a, b) => {
      if (a.status === 'erledigt' && b.status !== 'erledigt') {
        return 1;
      } else if (a.status !== 'erledigt' && b.status === 'erledigt') {
        return -1;
      } else {
        return 0;
      }
    });

    return sortedData;
  };

  const handleMeFilter = async () => {
    if (!showMyItems) {
      const response = await getUser();
      setCurrentUser(response.id);
      setShowMyItems(true);
    } else {
      setShowMyItems(false);
    }
  };

  const displayData = getFilterAndSortedData();

  return {
    descriptionSearch,
    setDescriptionSearch,
    currentUser,
    setCurrentUser,
    showMyItems,
    setShowMyItems,
    handleMeFilter,
    displayData,
  };
}

export default useFilteredData;
