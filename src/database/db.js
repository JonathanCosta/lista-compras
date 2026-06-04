import Dexie from 'dexie'

const db = new Dexie('SmartCheck')

db.version(1).stores({
  categories: '++id, name, order, isEditable',
  items: '++id, categoryId, name, quantity, price, isChecked',
})

db.on('ready', async () => {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd([
      { name: 'Sacolão', order: 1, isEditable: false },
      { name: 'Carnes', order: 2, isEditable: false },
      { name: 'Bebidas', order: 3, isEditable: false },
      { name: 'Limpeza', order: 4, isEditable: false },
      { name: 'Higiene', order: 5, isEditable: false },
      { name: 'Diversos', order: 6, isEditable: false },
    ])
  }
})

export default db
