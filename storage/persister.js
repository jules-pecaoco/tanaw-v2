import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default asyncStoragePersister;
