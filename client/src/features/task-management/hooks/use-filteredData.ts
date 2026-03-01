import { getUser } from '@/apis/index.apis';
import { useState } from 'react';
import { api_Response } from '../types/index.type';

function useFilteredData(data: api_Response | undefined) {
  const [descriptionSearch, setDescriptionSearch] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<number | null>(null);
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
        console.log('THIS IS THE FIELD IF');
        console.log(field.owner_id);
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
      console.log('THIS IS THE RESPONSE ID');
      console.log(response.id);
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
