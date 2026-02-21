import { useDispatch, useSelector } from 'react-redux';

/** @type {() => import('../store').store.dispatch} */
export const useAppDispatch = useDispatch;

/** @type {import('react-redux').TypedUseSelectorHook<ReturnType<import('../store').store.getState>>} */
export const useAppSelector = useSelector;
