import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// This file is used to create a persister for React Query using AsyncStorage
// It allows React Query to persist its cache in AsyncStorage
// so that the data can be retained across app restarts/be use in offline mode.
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default asyncStoragePersister;
