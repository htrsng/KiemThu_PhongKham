import axios from 'axios'

export const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 15000,
})

export type ApiListResponse<T> = {
    data: T[]
    total?: number
}

export type ApiItemResponse<T> = {
    data: T
}

export type ApiDeleteResponse = {
    deletedCount: number
}
