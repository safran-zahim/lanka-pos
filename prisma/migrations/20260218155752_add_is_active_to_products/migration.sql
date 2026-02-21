-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "skuCode" TEXT,
    "barcode" TEXT,
    "barcodeType" TEXT,
    "description" TEXT,
    "price" DECIMAL,
    "reorderLevel" DECIMAL NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "categoryId" INTEGER,
    "brandId" INTEGER,
    "unitId" INTEGER,
    "subCategoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("barcode", "barcodeType", "brandId", "category", "categoryId", "createdAt", "description", "id", "name", "price", "reorderLevel", "skuCode", "subCategoryId", "unitId", "updatedAt") SELECT "barcode", "barcodeType", "brandId", "category", "categoryId", "createdAt", "description", "id", "name", "price", "reorderLevel", "skuCode", "subCategoryId", "unitId", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_skuCode_key" ON "Product"("skuCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
