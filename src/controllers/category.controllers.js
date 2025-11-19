import {ApiResponse} from '../utils/api-response.js';
import {ApiError} from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Category } from '../models/category.model.js';
import cloudinary from '../config/cloudinary.js';

const categoryList = asyncHandler(async (req, res) => {
   try{
    const { status } = req.query;
    const filter = {};

    if(status !== undefined) {
        filter.status = Number(status);
    }
    const categories = await Category.find(filter).populate("parentCategory", "name").sort({ createdAt: -1});
   
    return res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully"));

   } catch (error) {
    console.log(error);
    throw new ApiError(500, 'Error while fetching categories', error);
   }
});

const createCategory = asyncHandler(async (req, res) =>{
    const { name, description,parentCategory, status } = req.body;

    const existingCategory = await Category.findOne({ name: name.toLowerCase() });
    if(existingCategory) {
       throw new ApiError(400, "Category with this name already exists");
    }

    let thumbnailData = {
        url:"https://placehold.co/600x400",
        localPath: ""
    }

    if (req.file) {
        const cloudImg = await cloudinary.uploader.upload(req.file.path, {
        folder: "category_thumbnails",
        });

        thumbnailData = {
        url: cloudImg.secure_url,
        localPath: cloudImg.public_id,   // because you use localPath for cloudinary public id
        };
    }

    const category = await Category.create({
        name: name.toLowerCase(),
        description,
        thumbnail:thumbnailData,
        parentCategory:parentCategory || null,
        createdBy: req.user?._id || null,
        status: status
    })

    return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
})

const categoryDetails = asyncHandler(async (req, res) => {
    try{
      const category = await Category.findById(req.params.id).populate("parentCategory", "name");
      if(category) {

        return res.status(200).json(new ApiResponse(200, category, "Category fetched successfully"));
      } else {

        return res.status(404).json(new ApiResponse(200, "Category not found"));
      }
    } catch (error) {
      throw new ApiError(500, 'Error while fetching categories', error);
    }
})

const updateCategory = asyncHandler(async(req, res) => {
    try{
        const { name, parentCategory, status, description } = req.body;
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        
        if (!category) {
            return res.status(404).json(new ApiResponse(404, null, "Category not found"));
        }
      
        if (name) category.name = name;
        if (description) category.description = description;
        if (status !== undefined) category.status = status;
        if (parentCategory) category.parentCategory = parentCategory;

        if(req.file) {

            if(category.thumbnail?.localPath) {
                await cloudinary.uploader.destroy(category.thumbnail.localPath);
            }

            const cloudImg = await cloudinary.uploader.upload(req.file.path, {
                folder:"category_thumbnails",
            });

            category.thumbnail = {
                url: cloudImg.secure_url,
                localPath: cloudImg.public_id,
            }
        }

        await category.save();

        return res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
    } catch (error) {
         console.log(error);
        throw new ApiError(500, 'Error while updating category', error);
    }
})

const deleteCategory = asyncHandler(async (req, res) => {
    try{
        const category = await Category.findById(req.params.id);
        
        if(!category){
          return res.status(404).json(new ApiResponse(200, "Category not found"));
        }
        
        if (category.thumbnail?.localPath){
            await cloudinary.uploader.destroy(category.thumbnail.localPath);
        }

        await Category.findByIdAndDelete(req.params.id);

        return res.status(200).json(new ApiResponse(200, category, "Category deleted successfully"));
        
    } catch (error) {
        throw new ApiError(500, 'Error while updating category', error);
    }
})

export {createCategory, categoryList, categoryDetails, updateCategory, deleteCategory};