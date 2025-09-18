import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch users");
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  deleteMessage: async (id) => {
    try {
      await axiosInstance.delete(`/messages/${id}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== id),
      }));
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to fetch messages"
        );
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error(error.response?.data?.message || "Failed to send message");
      }
    }
  },

  // Các phương thức khác giữ nguyên...
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
