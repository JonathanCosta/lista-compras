import db from '../database/db'
import { sanitizePrice, sanitizeQuantity, sanitizeString } from '../utils/sanitize'

export function useDb() {
  async function getCategories() {
    return db.categories.orderBy('order').toArray()
  }

  async function getItemsByCategory(categoryId) {
    return db.items.where('categoryId').equals(categoryId).toArray()
  }

  async function getAllItems() {
    return db.items.toArray()
  }

  async function addItem({ categoryId, name, quantity, price }) {
    return db.items.add({
      categoryId,
      name: sanitizeString(name),
      quantity: sanitizeQuantity(quantity),
      price: sanitizePrice(price),
      isChecked: 0,
    })
  }

  async function updateItem(id, data) {
    const sanitized = {}
    if (data.name !== undefined) sanitized.name = sanitizeString(data.name)
    if (data.quantity !== undefined) sanitized.quantity = sanitizeQuantity(data.quantity)
    if (data.price !== undefined) sanitized.price = sanitizePrice(data.price)
    return db.items.update(id, sanitized)
  }

  async function deleteItem(id) {
    return db.items.delete(id)
  }

  async function addCategory(name) {
    const maxOrder = await db.categories.orderBy('order').last()
    return db.categories.add({
      name: sanitizeString(name),
      order: (maxOrder?.order || 0) + 1,
      isEditable: true,
    })
  }

  async function renameCategory(id, name) {
    return db.categories.update(id, { name: sanitizeString(name) })
  }

  async function deleteCategory(id) {
    await db.transaction('rw', db.categories, db.items, async () => {
      await db.items.where('categoryId').equals(id).delete()
      await db.categories.delete(id)
    })
  }

  async function toggleCheck(itemId) {
    const item = await db.items.get(itemId)
    if (!item) return
    return db.items.update(itemId, { isChecked: item.isChecked ? 0 : 1 })
  }

  async function updatePrice(itemId, newPrice) {
    return db.items.update(itemId, { price: sanitizePrice(newPrice) })
  }

  async function uncheckAll() {
    await db.items.toCollection().modify({ isChecked: 0 })
  }

  async function exportToJSON() {
    const categories = await db.categories.toArray()
    const items = await db.items.toArray()
    return { categories, items }
  }

  async function importFromJSON(data) {
    if (!data.categories || !data.items) {
      throw new Error('Formato inválido')
    }
    await db.transaction('rw', db.categories, db.items, async () => {
      await db.categories.clear()
      await db.items.clear()
      await db.categories.bulkAdd(data.categories)
      await db.items.bulkAdd(data.items)
    })
  }

  return {
    getCategories,
    getItemsByCategory,
    getAllItems,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    renameCategory,
    deleteCategory,
    toggleCheck,
    updatePrice,
    uncheckAll,
    exportToJSON,
    importFromJSON,
  }
}
