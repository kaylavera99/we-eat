import React, { useState } from 'react';
import { IonSearchbar } from '@ionic/react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');


// state change on search bar component
  const handleSearchInput = (e: CustomEvent) => {
    const query = e.detail.value as string;
    setSearchText(query);
    onSearch(query);
  };

  return (
    <IonSearchbar
      value={searchText}
      onIonInput={handleSearchInput}
      debounce = {0}
      placeholder="Search menu"
    />
  );
};

export default SearchBar;
